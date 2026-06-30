import { prisma } from '../config/db';
import { getPingProvider } from '../integrations';
import { telemetry } from '../utils/telemetry';

const pingProvider = getPingProvider();

export const runDeprovisioningSweep = async (): Promise<void> => {
  try {
    const expiredGrants = await prisma.emergencyAccessGrant.findMany({
      where: {
        expiresAt: { lte: new Date() },
        isRevoked: false
      }
    });

    if (expiredGrants.length === 0) return;

    console.log(`[Revocation Engine] Sweeping ${expiredGrants.length} expired break-glass access grants...`);

    for (const grant of expiredGrants) {
      await prisma.$transaction(async (tx) => {
        // 1. Set local database status to revoked
        await tx.emergencyAccessGrant.update({
          where: { id: grant.id },
          data: { isRevoked: true }
        });

        // 2. Call IDM adapter to teardown role provisioning
        await pingProvider.deprovisionAccess(grant.ephemeralToken);

        // 3. Create Audit Trail
        await tx.auditLog.create({
          data: {
            actorPingId: 'SYSTEM',
            action: 'ACCESS_SCOPE_AUTO_REVOKED',
            resource: `AccessGrant:${grant.id}`,
            ipAddress: '127.0.0.1',
            userAgent: 'Heirloom Cron Engine',
            pingProduct: 'PingIDM',
            detailsJson: {
              grantId: grant.id,
              assetId: grant.assetId,
              ephemeralToken: grant.ephemeralToken
            }
          }
        });
      });

      telemetry.publish({
        pingProduct: 'PingIDM',
        action: 'ACCESS_GRANTS_REVOKED',
        details: {
          grantId: grant.id,
          token: grant.ephemeralToken,
          status: 'AUTO_REVOKED'
        }
      });
    }

    console.log(`[Revocation Engine] Successfully revoked all expired scopes.`);
  } catch (error) {
    console.error('[Revocation Engine] Sweep job encountered error:', error);
  }
};

export const startDeprovisionJob = (): void => {
  console.log('[Heirloom Scheduler] Automatic Revocation Engine sweeps initialized (Interval: 60s)');
  // Execute sweep immediately on startup, then every 60 seconds
  runDeprovisioningSweep();
  setInterval(runDeprovisioningSweep, 60 * 1000);
};
