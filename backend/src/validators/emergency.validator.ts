import { z } from 'zod';

export const createEmergencyRequestSchema = z.object({
  policyId: z.string().uuid('Invalid policy reference ID'),
  ownerPingId: z.string().min(1, 'Owner identifier is required'),
  requesterPingId: z.string().min(1, 'Requester identifier is required'),
  urgencyReason: z.string().min(10, 'Reason must be at least 10 characters long').max(1000)
});
