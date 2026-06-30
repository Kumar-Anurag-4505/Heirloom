import { Request, Response, NextFunction } from 'express';
import { UserRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';
import { getPingProvider } from '../integrations';
import { cryptoService } from '../services/crypto.service';
import { telemetry } from '../utils/telemetry';
import { RequestStatus } from '@prisma/client';
import * as crypto from 'crypto';

export class EmergencyController {
  private pingProvider = getPingProvider();
  
  public create = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const { policyId, ownerPingId, requesterPingId, urgencyReason } = req.body;

      // Validate policy exists
      const policy = await prisma.policy.findUnique({
        where: { id: policyId }
      });

      if (!policy) {
        res.status(404).json({
          success: false,
          message: 'Target access policy not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const request = await prisma.emergencyRequest.create({
        data: {
          policyId,
          ownerPingId,
          requesterPingId,
          urgencyReason,
          status: 'SUBMITTED'
        },
        include: {
          policy: true
        }
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: requesterPingId,
          action: 'EMERGENCY_REQUEST_SUBMITTED',
          resource: `EmergencyRequest:${request.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingAM',
          detailsJson: { policyId, ownerPingId }
        }
      });

      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'EMERGENCY_REQUEST_RECEIVED',
        details: {
          requestId: request.id,
          policyId,
          requesterId: requesterPingId,
          status: 'SUBMITTED'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Emergency request registered successfully',
        data: request,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public uploadEvidence = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const id = req.params.id;
      const { documentUrl } = req.body;

      const request = await prisma.emergencyRequest.findUnique({
        where: { id }
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Request not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const updated = await prisma.emergencyRequest.update({
        where: { id },
        data: {
          evidenceDocument: documentUrl,
          status: 'UNDER_VERIFIER_REVIEW'
        }
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: request.requesterPingId,
          action: 'EMERGENCY_EVIDENCE_SUBMITTED',
          resource: `EmergencyRequest:${request.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingIDM',
          detailsJson: { evidenceDocument: documentUrl }
        }
      });

      telemetry.publish({
        pingProduct: 'PingIDM',
        action: 'EVIDENCE_REVIEW_QUEUED',
        details: {
          requestId: request.id,
          status: 'UNDER_VERIFIER_REVIEW'
        }
      });

      res.status(200).json({
        success: true,
        message: 'Evidence document registered, status updated to verifier review',
        data: updated,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const id = req.params.id;
      const approverPingId = req.user?.sub;
      if (!approverPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const request = await prisma.emergencyRequest.findUnique({
        where: { id },
        include: { policy: true }
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Emergency request not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Check authorization (Must be Owner of the assets or a registered Verifier)
      const isOwner = request.ownerPingId === approverPingId;
      const isVerifier = request.verifierPingId === approverPingId || req.user?.roles.includes('ADMIN');

      if (!isOwner && !isVerifier) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized approval request',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const durationHours = request.policy.durationHours;
      const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

      // Fetch bound assets list from access policy
      const policyBindings = await prisma.assetPolicy.findMany({
        where: { policyId: request.policyId }
      });

      const assetIds = policyBindings.map(b => b.assetId);

      // Perform transaction to generate access grants and update request status
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update Request State
        const r = await tx.emergencyRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            expiresAt,
            verifierPingId: isVerifier ? approverPingId : request.verifierPingId
          }
        });

        // 2. Call Identity provisioning adapters
        const provisionResult = await this.pingProvider.provisionTemporaryAccess({
          requestId: id,
          requesterPingId: request.requesterPingId,
          ownerPingId: request.ownerPingId,
          assets: assetIds,
          durationHours
        });

        // 3. Create Emergency Access Grants for each asset bound
        const grantsData = assetIds.map(assetId => ({
          requestId: id,
          assetId,
          ephemeralToken: provisionResult.ephemeralToken, // Using generated scoped token
          expiresAt
        }));

        await tx.emergencyAccessGrant.createMany({
          data: grantsData
        });

        return r;
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: approverPingId,
          action: 'EMERGENCY_REQUEST_APPROVED',
          resource: `EmergencyRequest:${request.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingIDM',
          detailsJson: { expiresAt: expiresAt.toISOString(), approvedBy: isOwner ? 'OWNER' : 'VERIFIER' }
        }
      });

      telemetry.publish({
        pingProduct: 'PingIDM',
        action: 'EMERGENCY_ACCESS_APPROVED',
        details: {
          requestId: request.id,
          approvedBy: approverPingId,
          duration: `${durationHours} Hours`,
          expiresAt: expiresAt.toISOString(),
          assetsCount: assetIds.length
        }
      });

      res.status(200).json({
        success: true,
        message: 'Request approved, access scopes provisioned',
        data: updated,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public reject = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const id = req.params.id;
      const rejectorId = req.user?.sub;
      if (!rejectorId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const request = await prisma.emergencyRequest.findUnique({
        where: { id }
      });

      if (!request || (request.ownerPingId !== rejectorId && !req.user?.roles.includes('ADMIN'))) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized rejection request',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const updated = await prisma.emergencyRequest.update({
        where: { id },
        data: {
          status: 'REJECTED'
        }
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: rejectorId,
          action: 'EMERGENCY_REQUEST_REJECTED',
          resource: `EmergencyRequest:${request.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingAM',
          detailsJson: { status: 'REJECTED' }
        }
      });

      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'EMERGENCY_ACCESS_REJECTED',
        details: {
          requestId: request.id,
          rejectedBy: rejectorId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Request rejected successfully',
        data: updated,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Fetch requests where user is Owner, Verifier, or Requester
      const requests = await prisma.emergencyRequest.findMany({
        where: {
          OR: [
            { ownerPingId: userId },
            { requesterPingId: userId },
            { verifierPingId: userId }
          ]
        },
        include: {
          policy: true,
          requester: true,
          owner: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        message: 'Emergency requests retrieved successfully',
        data: requests,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public get = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const id = req.params.id;
      const request = await prisma.emergencyRequest.findUnique({
        where: { id },
        include: {
          policy: true,
          requester: true,
          owner: true
        }
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Request not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Request details fetched successfully',
        data: request,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getVaultByToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const token = req.params.token;

      // Find active access grants matching this token
      const grants = await prisma.emergencyAccessGrant.findMany({
        where: {
          ephemeralToken: token,
          expiresAt: { gt: new Date() },
          isRevoked: false
        },
        include: {
          asset: true
        }
      });

      if (grants.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Emergency access token is invalid, expired, or has been revoked.',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Decrypt payloads and build scoped asset results
      const assets = grants.map(g => {
        let decryptedPayload: string | undefined = undefined;
        if (g.asset.encryptedPayload) {
          decryptedPayload = cryptoService.decrypt(g.asset.encryptedPayload);
        }
        
        return {
          id: g.asset.id,
          title: g.asset.title,
          description: g.asset.description,
          category: g.asset.category,
          sensitivityRisk: g.asset.sensitivityRisk,
          decryptedPayload,
          createdAt: g.asset.createdAt
        };
      });

      res.status(200).json({
        success: true,
        message: 'Scoped emergency vault assets decrypted successfully',
        data: {
          expiresAt: grants[0].expiresAt,
          assets
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getAvailablePolicies = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const requesterPingId = req.user?.sub;
      const { ownerEmail } = req.query;

      if (!requesterPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (!ownerEmail) {
        res.status(400).json({
          success: false,
          message: 'Owner email query parameter is required',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Resolve owner by email
      const owner = await prisma.user.findUnique({
        where: { email: ownerEmail as string }
      });

      if (!owner) {
        res.status(404).json({
          success: false,
          message: 'Target legacy owner profile not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Validate requester is a verified contact
      const contact = await prisma.emergencyContact.findFirst({
        where: {
          ownerPingId: owner.id,
          contactEmail: req.user?.email,
          verificationStatus: 'VERIFIED'
        }
      });

      if (!contact) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not verified as an emergency contact for this owner',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Retrieve policies matching relationship
      const policies = await prisma.policy.findMany({
        where: {
          ownerPingId: owner.id,
          targetRelationship: contact.relationship,
          isEnabled: true
        },
        include: {
          assets: {
            include: {
              asset: true
            }
          },
          owner: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Eligible legacy policies retrieved successfully',
        data: policies,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
export const emergencyController = new EmergencyController();
