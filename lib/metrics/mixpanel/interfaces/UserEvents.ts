import type { BaseEvent } from 'lib/metrics/mixpanel/interfaces';
import type { IdentityType } from 'models/User';

export interface UserCreatedEvent extends BaseEvent {
  identityType: IdentityType;
}

export interface UserEvents {
  UserCreated: UserCreatedEvent;
}
