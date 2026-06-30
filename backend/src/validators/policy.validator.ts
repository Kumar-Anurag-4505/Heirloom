import { z } from 'zod';
import { RiskLevel } from '@prisma/client';

export const createPolicySchema = z.object({
  name: z.string().min(1, 'Policy name is required').max(100),
  description: z.string().max(500).optional(),
  targetRelationship: z.string().min(1, 'Target relationship is required'),
  eventTrigger: z.string().min(1, 'Event trigger condition is required'),
  maxRiskThreshold: z.nativeEnum(RiskLevel).default(RiskLevel.HIGH),
  requiresVerifier: z.boolean().default(true),
  timeDelayHours: z.number().int().nonnegative().default(0),
  durationHours: z.number().int().positive().default(24),
  assetIds: z.array(z.string().uuid()).min(1, 'At least one protected asset must be bound to this policy')
});
