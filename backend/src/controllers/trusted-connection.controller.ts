import { Response, NextFunction } from 'express';
import { UserRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';
import { cryptoService } from '../services/crypto.service';
import * as crypto from 'crypto';

export class TrustedConnectionController {
  
  public getInvitations = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const email = req.user?.email;
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'User email not found in session',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const invitations = await prisma.emergencyContact.findMany({
        where: {
          contactEmail: { equals: email, mode: 'insensitive' },
          verificationStatus: 'PENDING'
        },
        orderBy: { createdAt: 'desc' }
      });

      const mapped = await Promise.all(invitations.map(async (inv) => {
        const owner = await prisma.user.findUnique({
          where: { id: inv.ownerPingId }
        });
        return {
          ...inv,
          ownerName: owner?.name || 'Unknown User',
          ownerEmail: owner?.email || inv.ownerPingId
        };
      }));

      res.status(200).json({
        success: true,
        message: 'Pending connection invitations retrieved',
        data: mapped,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public acceptInvitation = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const { id } = req.params;
      const userPingId = req.user?.sub;
      const email = req.user?.email;

      if (!userPingId || !email) {
        res.status(401).json({
          success: false,
          message: 'Session context is incomplete',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const invitation = await prisma.emergencyContact.findFirst({
        where: {
          id,
          contactEmail: { equals: email, mode: 'insensitive' },
          verificationStatus: 'PENDING'
        }
      });

      if (!invitation) {
        res.status(404).json({
          success: false,
          message: 'Invitation not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const updated = await prisma.emergencyContact.update({
        where: { id },
        data: {
          verificationStatus: 'VERIFIED',
          contactPingId: userPingId
        }
      });

      // Notify the owner
      await prisma.notification.create({
        data: {
          userId: invitation.ownerPingId,
          title: 'Trusted Connection Established',
          message: `${req.user?.name || email} accepted your trusted connection invitation.`
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          actorPingId: userPingId,
          action: 'INVITATION_ACCEPTED',
          resource: `Contact:${id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingIDM',
          detailsJson: { ownerPingId: invitation.ownerPingId }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Connection accepted successfully',
        data: updated,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public rejectInvitation = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const { id } = req.params;
      const email = req.user?.email;

      if (!email) {
        res.status(401).json({
          success: false,
          message: 'Session context is incomplete',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const invitation = await prisma.emergencyContact.findFirst({
        where: {
          id,
          contactEmail: { equals: email, mode: 'insensitive' },
          verificationStatus: 'PENDING'
        }
      });

      if (!invitation) {
        res.status(404).json({
          success: false,
          message: 'Invitation not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const updated = await prisma.emergencyContact.update({
        where: { id },
        data: {
          verificationStatus: 'REJECTED'
        }
      });

      // Notify owner
      await prisma.notification.create({
        data: {
          userId: invitation.ownerPingId,
          title: 'Invitation Declined',
          message: `${req.user?.name || email} declined your trusted connection invitation.`
        }
      });

      res.status(200).json({
        success: true,
        message: 'Invitation rejected successfully',
        data: updated,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getConnections = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const userPingId = req.user?.sub;
      const email = req.user?.email;

      if (!userPingId || !email) {
        res.status(401).json({
          success: false,
          message: 'Session context is incomplete',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Outgoing: connections I initiated that are verified
      const outgoing = await prisma.emergencyContact.findMany({
        where: {
          ownerPingId: userPingId,
          verificationStatus: 'VERIFIED'
        }
      });

      // Incoming: connections others initiated that I accepted
      const incoming = await prisma.emergencyContact.findMany({
        where: {
          contactPingId: userPingId,
          verificationStatus: 'VERIFIED'
        }
      });

      const mappedOutgoing = await Promise.all(outgoing.map(async (c) => {
        const contactUser = await prisma.user.findFirst({
          where: { email: { equals: c.contactEmail, mode: 'insensitive' } }
        });
        return {
          id: c.id,
          name: c.contactName,
          email: c.contactEmail,
          relationship: c.relationship,
          trustLevel: c.trustLevel,
          contactUserId: contactUser?.id || null
        };
      }));

      const mappedIncoming = await Promise.all(incoming.map(async (c) => {
        const owner = await prisma.user.findUnique({
          where: { id: c.ownerPingId }
        });
        return {
          id: c.id,
          name: owner?.name || 'Unknown Owner',
          email: owner?.email || c.ownerPingId,
          relationship: c.relationship,
          trustLevel: c.trustLevel,
          ownerUserId: c.ownerPingId
        };
      }));

      res.status(200).json({
        success: true,
        message: 'Active trusted connections retrieved',
        data: {
          trustingOthers: mappedIncoming, // People who trust me (I am their contact)
          trustedByOthers: mappedOutgoing // People I trust (they are my contact)
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getSharedAssets = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const userPingId = req.user?.sub;
      if (!userPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Retrieve active access grants
      const grants = await prisma.emergencyAccessGrant.findMany({
        where: {
          request: { requesterPingId: userPingId },
          expiresAt: { gt: new Date() },
          isRevoked: false
        },
        include: {
          asset: {
            include: {
              owner: true
            }
          },
          request: {
            include: {
              policy: true
            }
          }
        }
      });

      // Group assets by owner profile
      const ownersMap = new Map<string, { 
        owner: { id: string; name: string; email: string };
        assets: any[];
      }>();

      for (const grant of grants) {
        const owner = grant.asset.owner;
        const ownerId = owner.id;
        
        if (!ownersMap.has(ownerId)) {
          ownersMap.set(ownerId, {
            owner: {
              id: ownerId,
              name: owner.name,
              email: owner.email
            },
            assets: []
          });
        }

        ownersMap.get(ownerId)?.assets.push({
          id: grant.asset.id,
          title: grant.asset.title,
          description: grant.asset.description,
          category: grant.asset.category,
          sensitivityRisk: grant.asset.sensitivityRisk,
          grantId: grant.id,
          expiresAt: grant.expiresAt,
          ciphertext: grant.asset.encryptedPayload,
          policyName: grant.request.policy.name
        });
      }

      res.status(200).json({
        success: true,
        message: 'Shared assets retrieved successfully',
        data: Array.from(ownersMap.values()),
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getDecryptedSharedAsset = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const { id } = req.params; // Asset ID
      const userPingId = req.user?.sub;

      if (!userPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Find an active grant mapping this asset and requester
      const grant = await prisma.emergencyAccessGrant.findFirst({
        where: {
          assetId: id,
          request: { requesterPingId: userPingId },
          expiresAt: { gt: new Date() },
          isRevoked: false
        },
        include: {
          asset: true
        }
      });

      if (!grant) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: No active permission policy satisfied for this asset',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      let decryptedPayload: string | undefined = undefined;
      if (grant.asset.encryptedPayload) {
        decryptedPayload = cryptoService.decrypt(grant.asset.encryptedPayload);
      }

      // Log: Shared Asset Viewed in AuditLog
      await prisma.auditLog.create({
        data: {
          actorPingId: userPingId,
          action: 'SHARED_ASSET_VIEWED',
          resource: `Asset:${id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingDS',
          detailsJson: { grantId: grant.id }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Shared asset decrypted successfully',
        data: {
          id: grant.asset.id,
          decryptedPayload
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getHistory = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const userPingId = req.user?.sub;
      if (!userPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Retrieve access requests related to this user (either owner or requester)
      const requests = await prisma.emergencyRequest.findMany({
        where: {
          OR: [
            { ownerPingId: userPingId },
            { requesterPingId: userPingId }
          ]
        },
        include: {
          requester: true,
          owner: true,
          policy: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Retrieve audit logs related to this user
      const logs = await prisma.auditLog.findMany({
        where: {
          actorPingId: userPingId
        },
        orderBy: { timestamp: 'desc' },
        take: 30
      });

      res.status(200).json({
        success: true,
        message: 'Consolidated access history retrieved successfully',
        data: {
          requests,
          auditLogs: logs
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getNotifications = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const userPingId = req.user?.sub;
      if (!userPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: userPingId },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public markNotificationRead = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const { id } = req.params;
      const userPingId = req.user?.sub;

      if (!userPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const updated = await prisma.notification.updateMany({
        where: { id, userId: userPingId },
        data: { isRead: true }
      });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: updated,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };
}

export const trustedConnectionController = new TrustedConnectionController();
