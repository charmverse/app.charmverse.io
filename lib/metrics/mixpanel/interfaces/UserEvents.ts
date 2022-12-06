import type { IdentityType } from '@prisma/client';

import type { TokenGateJoinType } from 'lib/token-gates/interfaces';

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
  | '';

export type SignupAnalytics = {
  signupLandingUrl: string;
  signupSource: SignupSource;
  signupCampaign: string;
};

export interface UserSignupEvent extends BaseEventWithoutGroup, Partial<SignupAnalytics> {
  identityType: IdentityType;
}

export interface UserLoginEvent extends BaseEventWithoutGroup {
  identityType: IdentityType;
}

export interface TokenGateVerificationEvent extends BaseEvent {
  roles?: string[];
  result: 'pass' | 'fail';
}

export interface SpaceJoined extends BaseEvent {
  source: 'invite_link' | TokenGateJoinType;
}

export interface UserEventMap {
  sign_up: UserSignupEvent;
  sign_in: UserLoginEvent;
  load_a_workspace: BaseEvent;
  create_new_workspace: BaseEvent;
  join_a_workspace: SpaceJoined;
  token_gate_verification: TokenGateVerificationEvent;
}
