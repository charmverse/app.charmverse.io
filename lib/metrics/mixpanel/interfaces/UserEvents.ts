import type { BaseEvent, SpaceEvent } from 'lib/metrics/mixpanel/interfaces';
import type { TokenGateJoinType } from 'lib/token-gates/interfaces';
import type { IdentityType } from 'models/User';

export interface UserCreatedEvent extends BaseEvent {
  identityType: IdentityType;
}

export interface TokenGateVerificationEvent extends BaseEvent, SpaceEvent {
  roles?: string[];
  result: 'pass' | 'fail';
}

export interface SpaceJoined extends SpaceEvent {
  source: 'invite_link' | TokenGateJoinType;
}

export interface UserEvents {
  sign_up: UserCreatedEvent;
  sign_in: UserCreatedEvent;
  load_a_workspace: SpaceEvent;
  create_new_workspace: SpaceEvent;
  join_a_workspace: SpaceJoined;
  token_gate_verification: TokenGateVerificationEvent;
}
