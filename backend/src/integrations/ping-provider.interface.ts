export interface AuthCredentials {
  email: string;
  password?: string;
}

export interface AuthResult {
  success: boolean;
  pingUserId: string;
  email: string;
  name: string;
  mfaRequired: boolean;
  tempSessionId?: string;
  riskScore: number;
}

export interface MfaChallengeResult {
  success: boolean;
  message: string;
}

export interface RiskContext {
  email: string;
  ipAddress: string;
  userAgent: string;
}

export interface RiskAssessmentResult {
  riskScore: number;
  recommendation: 'ALLOW' | 'CHALLENGE' | 'DENY';
}

export interface ProvisionGrant {
  requestId: string;
  requesterPingId: string;
  ownerPingId: string;
  assets: string[];
  durationHours: number;
}

export interface ProvisionResult {
  success: boolean;
  ephemeralToken: string;
  expiresAt: Date;
}

export interface UserProfile {
  email: string;
  name: string;
}

export interface DirectorySyncResult {
  success: boolean;
  pingUserId: string;
}

export interface IPingIdentityProvider {
  authenticateUser(credentials: AuthCredentials): Promise<AuthResult>;
  triggerMfaChallenge(tempSessionId: string, otpCode?: string): Promise<MfaChallengeResult>;
  evaluateRiskScore(context: RiskContext): Promise<RiskAssessmentResult>;
  provisionTemporaryAccess(grant: ProvisionGrant): Promise<ProvisionResult>;
  deprovisionAccess(grantId: string): Promise<void>;
  syncDirectoryUser(userProfile: UserProfile): Promise<DirectorySyncResult>;
}
