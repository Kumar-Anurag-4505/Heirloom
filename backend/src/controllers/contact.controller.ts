import { Response, NextFunction } from 'express';
import { UserRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/db';
import { getPingProvider } from '../integrations';
import { TrustLevel } from '@prisma/client';
import * as crypto from 'crypto';

export class ContactController {
  private pingProvider = getPingProvider();

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

      const { contactEmail, contactName, relationship, trustLevel } = req.body;

      // 1. Sync relation attributes inside mock directory (PingDS/PingIDM)
      const mappedTrustLevel = trustLevel as TrustLevel || TrustLevel.LEVEL_1_IMMEDIATE;
      
      const contact = await prisma.emergencyContact.create({
        data: {
          ownerPingId,
          contactEmail,
          contactName,
          relationship,
          trustLevel: mappedTrustLevel,
          verificationStatus: 'PENDING'
        }
      });

      // 2. Publish Telemetry event log
      await prisma.auditLog.create({
        data: {
          actorPingId: ownerPingId,
          action: 'CONTACT_ADDED',
          resource: `Contact:${contact.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingDS',
          detailsJson: { contactEmail, relationship, trustLevel }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Contact registered, invitation verification dispatched',
        data: contact,
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

      const contacts = await prisma.emergencyContact.findMany({
        where: { ownerPingId },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        message: 'Contacts retrieved successfully',
        data: contacts,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };

  public verify = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const contactId = req.params.id;
      const contact = await prisma.emergencyContact.findUnique({
        where: { id: contactId }
      });

      if (!contact || contact.ownerPingId !== ownerPingId) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // Simulate PingDS directory syncing completion
      const mockContactPingId = 'ping-usr-' + crypto.randomBytes(4).toString('hex');

      const updated = await prisma.emergencyContact.update({
        where: { id: contactId },
        data: {
          verificationStatus: 'VERIFIED',
          contactPingId: mockContactPingId
        }
      });

      // Synchronize contact inside local user mock directory if needed
      await prisma.user.upsert({
        where: { id: mockContactPingId },
        update: {},
        create: {
          id: mockContactPingId,
          email: contact.contactEmail,
          name: contact.contactName
        }
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: ownerPingId,
          action: 'CONTACT_VERIFIED',
          resource: `Contact:${contactId}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingIDM',
          detailsJson: { contactPingId: mockContactPingId, email: contact.contactEmail }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Contact identity sync verification completed',
        data: updated,
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

      const contactId = req.params.id;
      const contact = await prisma.emergencyContact.findUnique({
        where: { id: contactId }
      });

      if (!contact || contact.ownerPingId !== ownerPingId) {
        res.status(404).json({
          success: false,
          message: 'Contact record not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      await prisma.emergencyContact.delete({
        where: { id: contactId }
      });

      res.status(200).json({
        success: true,
        message: 'Contact removed successfully',
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
      const { contactEmail, contactName, relationship, trustLevel, verificationStatus } = req.body;

      if (!contactEmail || !contactName) {
        res.status(400).json({
          success: false,
          message: 'Contact name and email are required',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const contact = await prisma.emergencyContact.findFirst({
        where: { id, ownerPingId }
      });

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact record not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const mappedTrustLevel = trustLevel as TrustLevel || contact.trustLevel;

      const updatedContact = await prisma.emergencyContact.update({
        where: { id },
        data: {
          contactEmail,
          contactName,
          relationship,
          trustLevel: mappedTrustLevel,
          verificationStatus: verificationStatus || contact.verificationStatus
        }
      });

      await prisma.auditLog.create({
        data: {
          actorPingId: ownerPingId,
          action: 'CONTACT_UPDATED',
          resource: `Contact:${updatedContact.id}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Unknown',
          pingProduct: 'PingDS',
          detailsJson: {
            contactEmail,
            contactName,
            relationship,
            trustLevel
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Contact updated successfully',
        data: updatedContact,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
export const contactController = new ContactController();
