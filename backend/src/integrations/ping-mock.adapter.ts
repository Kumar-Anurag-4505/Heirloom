import { 
  IPingIdentityProvider, 
  AuthCredentials, 
  AuthResult, 
  MfaChallengeResult, 
  RiskContext, 
  RiskAssessmentResult, 
  ProvisionGrant, 
  ProvisionResult, 
  UserProfile, 
  DirectorySyncResult 
} from './ping-provider.interface';
import { telemetry } from '../utils/telemetry';
import * as crypto from 'crypto';

export class PingMockAdapter implements IPingIdentityProvider {
  // Simulated database directory storage (LDAP tree representation)
  private mockDirectory: Map<string, { email: string; name: string; roles: string[] }> = new Map([
    ['ping-usr-rahul', { email: 'rahul@heirloom.io', name: 'Rahul Sharma', roles: ['OWNER'] }],
    ['ping-usr-priya', { email: 'priya@heirloom.io', name: 'Priya Sharma', roles: ['CONTACT'] }],
    ['ping-usr-mohit', { email: 'mohit@heirloom.io', name: 'Mohit Sharma', roles: ['NOMINEE'] }],
    ['ping-usr-verma', { email: 'dr.verma@cityhospital.org', name: 'Dr. Verma', roles: ['VERIFIER'] }],
    ['ping-usr-admin', { email: 'admin@heirloom.io', name: 'System Admin', roles: ['ADMIN'] }]
  ]);

  private activeTempSessions: Map<string, { email: string; pingUserId: string; mfaCode: string }> = new Map();

  async authenticateUser(credentials: AuthCredentials): Promise<AuthResult> {
    telemetry.publish({
      pingProduct: 'PingAM',
      action: 'AUTHENTICATION_NODE_TRIGGERED',
      details: {
        nodeType: 'UsernamePasswordCollectorNode',
        inputEmail: credentials.email,
        status: 'PROCESSING'
      }
    });

    // Find user in mock directory by email
    let foundId: string | null = null;
    let foundProfile: any = null;

    for (const [id, profile] of this.mockDirectory.entries()) {
      if (profile.email.toLowerCase() === credentials.email.toLowerCase()) {
        foundId = id;
        foundProfile = profile;
        break;
      }
    }

    if (!foundId || !foundProfile) {
      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'AUTHENTICATION_FAILED',
        details: {
          email: credentials.email,
          reason: 'User not found in PingDS Identity Repository'
        }
      });
      throw new Error('Invalid email or password');
    }

    // Evaluate Risk Score using mock Protect adapter
    const riskResult = await this.evaluateRiskScore({
      email: credentials.email,
      ipAddress: '127.0.0.1',
      userAgent: 'Mock User Browser'
    });

    const mfaRequired = riskResult.recommendation === 'CHALLENGE' || foundProfile.roles.includes('ADMIN') || foundProfile.roles.includes('CONTACT');

    const tempSessionId = crypto.randomUUID();
    const mockMfaCode = '123456'; // Standard mock OTP

    if (mfaRequired) {
      this.activeTempSessions.set(tempSessionId, {
        email: foundProfile.email,
        pingUserId: foundId,
        mfaCode: mockMfaCode
      });

      telemetry.publish({
        pingProduct: 'PingID',
        action: 'MFA_CHALLENGE_ISSUED',
        details: {
          tempSessionId,
          pingUserId: foundId,
          channel: 'PUSH_SMS_OTP',
          mockOtp: mockMfaCode,
          reason: `Step-Up required. Recommendation: ${riskResult.recommendation}`
        }
      });
    } else {
      telemetry.publish({
        pingProduct: 'PingAM',
        action: 'AUTHENTICATION_SUCCESS',
        details: {
          pingUserId: foundId,
          roles: foundProfile.roles,
          mfaRequired: false
        }
      });
    }

    return {
      success: true,
      pingUserId: foundId,
      email: foundProfile.email,
      name: foundProfile.name,
      mfaRequired,
      tempSessionId: mfaRequired ? tempSessionId : undefined,
      riskScore: riskResult.riskScore
    };
  }

  async triggerMfaChallenge(tempSessionId: string, otpCode?: string): Promise<MfaChallengeResult> {
    const session = this.activeTempSessions.get(tempSessionId);
    if (!session) {
      throw new Error('Invalid or expired authentication session');
    }

    if (otpCode !== session.mfaCode) {
      telemetry.publish({
        pingProduct: 'PingID',
        action: 'MFA_CHALLENGE_FAILED',
        details: {
          tempSessionId,
          inputCode: otpCode,
          expectedCode: session.mfaCode
        }
      });
      return { success: false, message: 'Invalid verification code' };
    }

    this.activeTempSessions.delete(tempSessionId);

    telemetry.publish({
      pingProduct: 'PingAM',
      action: 'AUTHENTICATION_SUCCESS',
      details: {
        pingUserId: session.pingUserId,
        mfaVerified: true
      }
    });

    return { success: true, message: 'MFA Verified Successfully' };
  }

  async evaluateRiskScore(context: RiskContext): Promise<RiskAssessmentResult> {
    // Generate a random risk score or base on role/email
    let riskScore = 15; // default low risk
    if (context.email.includes('admin') || context.email.includes('priya')) {
      riskScore = 75; // medium-high risk trigger for step-up demo
    }

    const recommendation = riskScore > 60 ? 'CHALLENGE' : 'ALLOW';

    telemetry.publish({
      pingProduct: 'PingOne Protect',
      action: 'RISK_EVALUATION_COMPLETED',
      details: {
        email: context.email,
        riskScore,
        recommendation,
        riskFactors: riskScore > 60 ? ['UntrustedLocation', 'DeviceVelocityAnomaly'] : []
      }
    });

    return { riskScore, recommendation };
  }

  async provisionTemporaryAccess(grant: ProvisionGrant): Promise<ProvisionResult> {
    const ephemeralToken = 'heirloom_grant_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + grant.durationHours * 3600 * 1000);

    telemetry.publish({
      pingProduct: 'PingIDM',
      action: 'TEMPORARY_ROLE_PROVISIONED',
      details: {
        requestId: grant.requestId,
        requesterId: grant.requesterPingId,
        ownerId: grant.ownerPingId,
        assets: grant.assets,
        expiresAt: expiresAt.toISOString(),
        roleAssigned: 'TEMP_DELEGATED_ACCESS'
      }
    });

    return {
      success: true,
      ephemeralToken,
      expiresAt
    };
  }

  async deprovisionAccess(grantId: string): Promise<void> {
    telemetry.publish({
      pingProduct: 'PingIDM',
      action: 'TEMPORARY_ROLE_DEPROVISIONED',
      details: {
        grantId,
        status: 'SUCCESS',
        rolesRemoved: ['TEMP_DELEGATED_ACCESS']
      }
    });
  }

  async syncDirectoryUser(userProfile: UserProfile): Promise<DirectorySyncResult> {
    // Check if email already exists in mockDirectory to prevent duplicate entries and keep IDs consistent
    for (const [id, profile] of this.mockDirectory.entries()) {
      if (profile.email.toLowerCase() === userProfile.email.toLowerCase()) {
        return {
          success: true,
          pingUserId: id
        };
      }
    }

    const pingUserId = 'ping-usr-' + crypto.randomBytes(6).toString('hex');
    this.mockDirectory.set(pingUserId, {
      email: userProfile.email,
      name: userProfile.name,
      roles: ['OWNER']
    });

    telemetry.publish({
      pingProduct: 'PingDS',
      action: 'IDENTITY_RECORD_CREATED',
      details: {
        pingUserId,
        email: userProfile.email,
        name: userProfile.name,
        ldapPath: `uid=${pingUserId},ou=users,dc=heirloom,dc=io`
      }
    });

    return {
      success: true,
      pingUserId
    };
  }
}
