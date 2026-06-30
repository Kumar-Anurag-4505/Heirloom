import { assetRepository } from '../repositories/asset.repository';
import { cryptoService } from './crypto.service';
import { prisma } from '../config/db';
import { telemetry } from '../utils/telemetry';
import { Asset, AssetCategory, RiskLevel } from '@prisma/client';

export class AssetService {
  public async createAsset(params: {
    ownerPingId: string;
    title: string;
    description?: string;
    category: AssetCategory;
    sensitivityRisk: RiskLevel;
    plaintextPayload?: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<Asset> {
    
    // Encrypt content if plaintext payload exists
    let encryptedPayload: string | null = null;
    if (params.plaintextPayload) {
      encryptedPayload = cryptoService.encrypt(params.plaintextPayload);
      
      telemetry.publish({
        pingProduct: 'PingDS',
        action: 'ASSET_PAYLOAD_ENCRYPTED',
        details: {
          ownerPingId: params.ownerPingId,
          category: params.category,
          algorithm: 'AES-256-GCM',
          keysize: '256-bit'
        }
      });
    }

    // Persist asset inside relational DB
    const asset = await assetRepository.create({
      ownerPingId: params.ownerPingId,
      title: params.title,
      description: params.description,
      category: params.category,
      sensitivityRisk: params.sensitivityRisk,
      encryptedPayload
    });

    // Create Platform Audit Trail Log
    await prisma.auditLog.create({
      data: {
        actorPingId: params.ownerPingId,
        action: 'ASSET_CREATED',
        resource: `Asset:${asset.id}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        pingProduct: 'PingDS',
        detailsJson: {
          assetId: asset.id,
          category: asset.category,
          sensitivity: asset.sensitivityRisk,
          isEncrypted: !!encryptedPayload
        }
      }
    });

    telemetry.publish({
      pingProduct: 'PingDS',
      action: 'ASSET_REGISTERED',
      details: {
        assetId: asset.id,
        ownerPingId: params.ownerPingId,
        category: asset.category,
        sensitivity: asset.sensitivityRisk
      }
    });

    return asset;
  }

  public async getAssets(ownerPingId: string, category?: AssetCategory): Promise<Asset[]> {
    return assetRepository.findByOwner(ownerPingId, category);
  }

  public async getAssetDetails(assetId: string, requestorPingId: string): Promise<Asset & { decryptedPayload?: string }> {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Ownership check (ABAC base validation)
    if (asset.ownerPingId !== requestorPingId) {
      // Check if there is an active emergency access grant
      const activeGrant = await prisma.emergencyAccessGrant.findFirst({
        where: {
          assetId,
          expiresAt: { gt: new Date() },
          isRevoked: false
          // In a real OAuth scenario, check the token scope matches
        }
      });

      if (!activeGrant) {
        throw new Error('Access denied. No active permission policy satisfied');
      }
    }

    // Decrypt content if encrypted payload exists
    let decryptedPayload: string | undefined = undefined;
    if (asset.encryptedPayload) {
      decryptedPayload = cryptoService.decrypt(asset.encryptedPayload);
      
      telemetry.publish({
        pingProduct: 'PingDS',
        action: 'ASSET_PAYLOAD_DECRYPTED',
        details: {
          assetId: asset.id,
          requestor: requestorPingId,
          success: true
        }
      });
    }

    return {
      ...asset,
      decryptedPayload
    };
  }

  public async deleteAsset(assetId: string, ownerPingId: string): Promise<void> {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.ownerPingId !== ownerPingId) {
      throw new Error('Unauthorized asset modification request');
    }

    await assetRepository.delete(assetId);

    telemetry.publish({
      pingProduct: 'PingDS',
      action: 'ASSET_ARCHIVED',
      details: {
        assetId,
        ownerPingId
      }
    });
  }
}
export const assetService = new AssetService();
