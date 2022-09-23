import type { BaseEvent, SpaceEvent } from 'lib/metrics/mixpanel/interfaces';
import type { IdentityType } from 'models/User';

export interface UserCreatedEvent extends BaseEvent {
  identityType: IdentityType;
}

export interface TokenGateVerificationEvent extends BaseEvent, SpaceEvent {
  roles?: string[];
  result: 'pass' | 'fail'
}

export interface SpaceJoined extends SpaceEvent {
  source: 'invite_link' | 'public_bounty_token_gate' | 'token_gate'
}

export interface UserEvents {
  UserCreated: UserCreatedEvent;
  UserLogin: UserCreatedEvent;
  SpaceLoaded: SpaceEvent;
  SpaceCreated: SpaceEvent;
  SpaceJoined: SpaceJoined;
  TokenGateVerification: TokenGateVerificationEvent;
}
