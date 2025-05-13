import type { BaseEvent } from './BaseEvent';

export interface ResourceEvent extends BaseEvent {
  resourceId: string;
}
