import type { TokenGateJoinType } from 'lib/token-gates/interfaces';
import type { IdentityType } from 'models/User';

import type { BaseEvent, BaseEventWithoutGroup } from './BaseEvent';

export interface UserCreatedEvent extends BaseEventWithoutGroup {
  identityType: IdentityType;
}

export interface TokenGateVerificationEvent extends BaseEvent {
  roles?: string[];
  result: 'pass' | 'fail';
}

export interface SpaceJoined extends BaseEvent{
  source: 'invite_link' | TokenGateJoinType;
}

export interface UserEventMap {
  sign_up: UserCreatedEvent;
  sign_in: UserCreatedEvent;
  load_a_workspace: BaseEvent;
  create_new_workspace: BaseEvent;
  join_a_workspace: SpaceJoined;
  token_gate_verification: TokenGateVerificationEvent;
}
