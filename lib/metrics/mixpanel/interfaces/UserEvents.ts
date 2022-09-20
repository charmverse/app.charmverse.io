import type { BaseEvent } from 'lib/metrics/mixpanel/interfaces';

export interface UserCreatedEvent extends BaseEvent {
  isWallet: boolean;
  isDiscord: boolean
}

export interface UserEvents {
  userCreated: UserCreatedEvent;
}
