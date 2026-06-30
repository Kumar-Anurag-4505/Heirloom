import { Response, NextFunction } from 'express';
import { UserRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';
import * as crypto from 'crypto';

export class DashboardController {
  
  public getSummary = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
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

      // Fetch dynamic KPI values
      const totalAssets = await prisma.asset.count({
        where: { ownerPingId: userPingId }
      });

      const activePolicies = await prisma.policy.count({
        where: { ownerPingId: userPingId, isEnabled: true }
      });

      const verifiedContacts = await prisma.emergencyContact.count({
        where: { ownerPingId: userPingId, verificationStatus: 'VERIFIED' }
      });

      // Get first contact details for display if available
      const firstContact = await prisma.emergencyContact.findFirst({
        where: { ownerPingId: userPingId },
        orderBy: { createdAt: 'desc' }
      });

      let primaryContactLabel = 'No contact registered';
      if (firstContact) {
        primaryContactLabel = `${firstContact.contactName || firstContact.contactEmail} (${firstContact.relationship})`;
        if (firstContact.verificationStatus !== 'VERIFIED') {
          primaryContactLabel += ` - ${firstContact.verificationStatus}`;
        }
      }

      // Calculate dynamic security score:
      // Base: 50. MFA: +20. Verified contacts: +15. Policies: +15.
      let securityScore = 50;
      // We assume user has MFA activated (mock PingAM integration defaults to true for active owners)
      securityScore += 20; 
      if (verifiedContacts > 0) securityScore += 15;
      if (activePolicies > 0) securityScore += 15;

      // Fetch dynamic Asset Category / Sensitivity distribution percentages
      const userAssets = await prisma.asset.findMany({
        where: { ownerPingId: userPingId }
      });

      const total = userAssets.length;
      let criticalPct = 0;
      let mediumPct = 0;
      let lowPct = 0;

      if (total > 0) {
        const criticalCount = userAssets.filter(a => a.sensitivityRisk === 'HIGH' || a.sensitivityRisk === 'CRITICAL').length;
        const mediumCount = userAssets.filter(a => a.sensitivityRisk === 'MEDIUM').length;
        const lowCount = userAssets.filter(a => a.sensitivityRisk === 'LOW').length;

        criticalPct = Math.round((criticalCount / total) * 100);
        mediumPct = Math.round((mediumCount / total) * 100);
        lowPct = Math.round((lowCount / total) * 100);
      }

      res.status(200).json({
        success: true,
        message: 'Owner dashboard summary calculated successfully',
        data: {
          totalAssets,
          activePolicies,
          verifiedContacts,
          primaryContactLabel,
          securityScore,
          assetDistribution: {
            critical: criticalPct,
            medium: mediumPct,
            low: lowPct
          }
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public getMyAuditLogs = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
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

      // Retrieve logs where the actor is the current user
      const logs = await prisma.auditLog.findMany({
        where: {
          actorPingId: userPingId
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      res.status(200).json({
        success: true,
        message: 'Personal audit history fetched successfully',
        data: logs,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
