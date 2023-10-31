import type { IdentityType } from '@charmverse/core/prisma';

import type { SpaceTemplateType } from 'lib/spaces/config';
import type { TokenGateJoinType } from 'lib/tokenGates/interfaces';

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
};

export type UserSignupEvent = BaseEventWithoutGroup &
  Partial<SignupAnalytics> & {
    identityType: IdentityType;
  };

export type UserLoginEvent = BaseEventWithoutGroup & {
  identityType: IdentityType;
};

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
  load_a_workspace: BaseEvent;
  create_new_workspace: CreateNewSpace;
  join_a_workspace: SpaceJoined;
  token_gate_verification: TokenGateVerificationEvent;
  app_loaded: AppLoaded;
}
