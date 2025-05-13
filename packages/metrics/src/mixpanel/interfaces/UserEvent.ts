import type { IdentityType } from '@charmverse/core/prisma';
import type { TokenGateJoinType } from '@packages/lib/tokenGates/interfaces';
import type { SpaceTemplateType } from '@packages/spaces/config';

import type { BaseEvent, BaseEventWithoutGroup } from './BaseEvent';

export type SignupSource =
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'organic-search'
  | 'marketing-site'
  | 'direct'
  | 'other'
  | ''
  | string;

export type SignupAnalytics = {
  signupLandingUrl: string;
  signupSource: SignupSource;
  signupCampaign: string;
  referrerCode: string;
};

export type UserSignupEvent = BaseEventWithoutGroup &
  Partial<SignupAnalytics> & {
    identityType: IdentityType;
  };

export type UserLoginEvent = BaseEventWithoutGroup & {
  identityType: IdentityType;
};

export type UserOtp = BaseEventWithoutGroup;

export type TokenGateVerificationEvent = BaseEvent & {
  roles?: string[];
  result: 'pass' | 'fail';
};

export type SpaceJoined = BaseEvent & {
  source: 'invite_link' | TokenGateJoinType | 'charmverse_api' | string;
};

export type CreateNewSpace = BaseEvent & {
  template: SpaceTemplateType;
  source?: string;
};

export type AppLoaded = BaseEventWithoutGroup & { spaceId?: string };

export interface UserEventMap {
  sign_up: UserSignupEvent;
  sign_in: UserLoginEvent;
  sign_in_otp: UserLoginEvent;
  sign_in_recovery_code: UserLoginEvent;
  load_a_workspace: BaseEvent;
  create_new_workspace: CreateNewSpace;
  join_a_workspace: SpaceJoined;
  token_gate_verification: TokenGateVerificationEvent;
  app_loaded: AppLoaded;
  delete_otp: UserOtp;
  add_otp: UserOtp;
}
