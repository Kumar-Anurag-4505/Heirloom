import { IPingIdentityProvider } from './ping-provider.interface';
import { PingMockAdapter } from './ping-mock.adapter';

// In a real project, this factory would load credentials from configuration
// and construct the real PingOne client, or mock adapter based on environment variable.
const activeAdapter: IPingIdentityProvider = new PingMockAdapter();

export const getPingProvider = (): IPingIdentityProvider => {
  return activeAdapter;
};
