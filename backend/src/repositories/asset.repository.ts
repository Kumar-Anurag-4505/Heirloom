import { prisma } from '../config/db';
import { Asset, AssetCategory, Prisma } from '@prisma/client';

export class AssetRepository {
  public async create(data: Prisma.AssetUncheckedCreateInput): Promise<Asset> {
    return prisma.asset.create({
      data
    });
  }

  public async findById(id: string): Promise<Asset | null> {
    return prisma.asset.findUnique({
      where: { id }
    });
  }

  public async findByOwner(ownerPingId: string, category?: AssetCategory): Promise<Asset[]> {
    return prisma.asset.findMany({
      where: {
        ownerPingId,
        ...(category ? { category } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  public async delete(id: string): Promise<Asset> {
    return prisma.asset.delete({
      where: { id }
    });
  }
}
export const assetRepository = new AssetRepository();
