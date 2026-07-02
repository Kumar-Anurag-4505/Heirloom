import { Response, NextFunction } from 'express';
import { UserRequest } from '../middlewares/auth.middleware';
import { assetService } from '../services/asset.service';
import { AssetCategory } from '@prisma/client';
import * as crypto from 'crypto';

export class AssetController {
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

      const { title, description, category, sensitivityRisk, plaintextPayload } = req.body;

      const asset = await assetService.createAsset({
        ownerPingId,
        title,
        description,
        category,
        sensitivityRisk,
        plaintextPayload,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      res.status(201).json({
        success: true,
        message: 'Asset protected successfully',
        data: asset,
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

      const categoryFilter = req.query.category as AssetCategory | undefined;
      const assets = await assetService.getAssets(ownerPingId, categoryFilter);

      res.status(200).json({
        success: true,
        message: 'Assets retrieved successfully',
        data: assets,
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
      const requestorId = req.user?.sub;
      if (!requestorId) {
        res.status(401).json({
          success: false,
          message: 'User session not found',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const assetId = req.params.id;
      const asset = await assetService.getAssetDetails(assetId, requestorId);

      res.status(200).json({
        success: true,
        message: 'Asset retrieved successfully',
        data: asset,
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

      const assetId = req.params.id;
      await assetService.deleteAsset(assetId, ownerPingId);

      res.status(200).json({
        success: true,
        message: 'Asset deleted and archived successfully',
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
      const { title, description, category, sensitivityRisk, plaintextPayload } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          message: 'Asset title is required',
          data: null,
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const asset = await assetService.updateAsset({
        assetId: id,
        ownerPingId,
        title,
        description,
        category,
        sensitivityRisk,
        plaintextPayload,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      res.status(200).json({
        success: true,
        message: 'Asset updated successfully',
        data: asset,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      next(error);
    }
  };
}
export const assetController = new AssetController();
