import { Response, NextFunction } from 'express';
import { UserRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';
import { telemetry } from '../utils/telemetry';
import { RiskLevel } from '@prisma/client';
import * as crypto from 'crypto';

export class PolicyController {
  public create = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const ownerPingId = req.user?.sub;
      if (!ownerPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const { 
        name, 
        description, 
        targetRelationship, 
        eventTrigger, 
        maxRiskThreshold, 
        requiresVerifier, 
        timeDelayHours, 
        durationHours,
        assetIds 
      } = req.body;

      // 1. Transactionally write visual policy and many-to-many bindings
      const policy = await prisma.$transaction(async (tx) => {
        const p = await tx.policy.create({
          data: {
            ownerPingId,
            name,
            description,
            targetRelationship,
            eventTrigger,
            maxRiskThreshold: maxRiskThreshold as RiskLevel || RiskLevel.HIGH,
            requiresVerifier: !!requiresVerifier,
            timeDelayHours: Number(timeDelayHours) || 0,
            durationHours: Number(durationHours) || 24
          }
        });

        // Generate bindings
        const bindings = assetIds.map((assetId: string) => ({
          assetId,
          policyId: p.id
        }));

        await tx.assetPolicy.createMany({
          data: bindings
        });

        return p;
      });

      // 2. Publish Telemetry event logs for developer console
      await prisma.auditLog.create({
        data: {
          actorPingId: ownerPingId,
          action: 'POLICY_CREATED',
          resource: `Policy:${policy.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingAM',
          detailsJson: {
            policyId: policy.id,
            targetRelationship,
            eventTrigger,
            boundAssetsCount: assetIds.length
          }
        }
      });

      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'POLICY_ENGINE_SYNCED',
        details: {
          policyId: policy.id,
          targetRelationship,
          eventTrigger,
          requiresVerifier,
          timeDelayHours
        }
      });

      res.status(201).json({
        success: true,
        message: 'Conditional access policy compiled and synced successfully',
        data: policy,
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
      const ownerPingId = req.user?.sub;
      if (!ownerPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const policies = await prisma.policy.findMany({
        where: { ownerPingId },
        include: {
          assets: {
            include: {
              asset: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        message: 'Policies retrieved successfully',
        data: policies,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const ownerPingId = req.user?.sub;
      if (!ownerPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const policyId = req.params.id;
      const policy = await prisma.policy.findUnique({
        where: { id: policyId }
      });

      if (!policy || policy.ownerPingId !== ownerPingId) {
        res.status(404).json({
          success: false,
          message: 'Policy not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      await prisma.policy.delete({
        where: { id: policyId }
      });

      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'POLICY_REMOVED',
        details: {
          policyId,
          ownerPingId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Access policy deleted successfully',
        data: null,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = crypto.randomUUID();
    try {
      const ownerPingId = req.user?.sub;
      if (!ownerPingId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const { id } = req.params;
      const { 
        name, 
        description, 
        targetRelationship, 
        eventTrigger, 
        maxRiskThreshold, 
        requiresVerifier, 
        timeDelayHours, 
        durationHours,
        assetIds 
      } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Policy name is required',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const existingPolicy = await prisma.policy.findFirst({
        where: { id, ownerPingId }
      });

      if (!existingPolicy) {
        res.status(404).json({
          success: false,
          message: 'Access policy not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const updatedPolicy = await prisma.$transaction(async (tx) => {
        const p = await tx.policy.update({
          where: { id },
          data: {
            name,
            description,
            targetRelationship,
            eventTrigger,
            maxRiskThreshold: maxRiskThreshold as RiskLevel || existingPolicy.maxRiskThreshold,
            requiresVerifier: requiresVerifier !== undefined ? !!requiresVerifier : existingPolicy.requiresVerifier,
            timeDelayHours: timeDelayHours !== undefined ? Number(timeDelayHours) : existingPolicy.timeDelayHours,
            durationHours: durationHours !== undefined ? Number(durationHours) : existingPolicy.durationHours
          }
        });

        if (assetIds && Array.isArray(assetIds)) {
          await tx.assetPolicy.deleteMany({
            where: { policyId: id }
          });

          const bindings = assetIds.map((assetId: string) => ({
            assetId,
            policyId: id
          }));

          await tx.assetPolicy.createMany({
            data: bindings
          });
        }

        return p;
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: ownerPingId,
          action: 'POLICY_UPDATED',
          resource: `Policy:${updatedPolicy.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingAM',
          detailsJson: {
            policyId: updatedPolicy.id,
            targetRelationship: updatedPolicy.targetRelationship,
            eventTrigger: updatedPolicy.eventTrigger,
            boundAssetsCount: assetIds ? assetIds.length : 0
          }
        }
      });

      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'POLICY_ENGINE_SYNCED',
        details: {
          policyId: updatedPolicy.id,
          targetRelationship: updatedPolicy.targetRelationship,
          eventTrigger: updatedPolicy.eventTrigger,
          requiresVerifier: updatedPolicy.requiresVerifier,
          timeDelayHours: updatedPolicy.timeDelayHours
        }
      });

      res.status(200).json({
        success: true,
        message: 'Conditional access policy updated successfully',
        data: updatedPolicy,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
export const policyController = new PolicyController();
