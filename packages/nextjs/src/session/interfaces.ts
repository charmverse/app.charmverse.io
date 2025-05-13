import type { Scout, IdentityType } from '@charmverse/core/prisma-client';
import type { IronSession } from 'iron-session';

export type SessionData = {
  // this data is only useful for authentication - it is not kept up-to-date!
  user: { id: string };
  // Used when we have a non signed in user
  anonymousUserId?: string;
  // Used when logged is as a different user
  isRemote?: boolean;
  // Used when not logged in and waiting for OTP to be validated
  otpUser?: { id: string; method: IdentityType };
};

// Types for API requests
declare module 'next' {
  interface NextApiRequest {
    session: IronSession<SessionData>;
  }
}

// Types for SSR
declare module 'http' {
  interface IncomingMessage {
    session: IronSession<SessionData>;
  }
}

export type SessionUser = Pick<
  Scout,
  | 'id'
  | 'path'
  | 'displayName'
  | 'avatar'
  | 'farcasterId'
  | 'farcasterName'
  | 'builderStatus'
  | 'currentBalance'
  | 'onboardedAt'
  | 'agreedToTermsAt'
  | 'bio'
  | 'referralCode'
  | 'deletedAt'
  | 'utmCampaign'
>;
