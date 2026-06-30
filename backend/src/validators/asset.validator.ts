import { z } from 'zod';
import { AssetCategory, RiskLevel } from '@prisma/client';

export const createAssetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(AssetCategory, {
    errorMap: () => ({ message: 'Invalid asset category' })
  }),
  sensitivityRisk: z.nativeEnum(RiskLevel, {
    errorMap: () => ({ message: 'Invalid risk classification level' })
  }),
  plaintextPayload: z.string().max(2000).optional()
});
