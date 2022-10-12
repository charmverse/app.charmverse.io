
import type { BaseEvent } from './BaseEvent';

export type AddInviteLink = BaseEvent & {
  expires: number | 'never';
  maxNumberOfUses: number | 'no limit';
}

export type AddAGate = BaseEvent & {
  numberOfConditions: number;
  chainType: string | string[];
  accesType: string | string [];
}

export type SettingEventMap = {
  add_invite_link: AddInviteLink;
  add_a_gate: AddAGate;
}
