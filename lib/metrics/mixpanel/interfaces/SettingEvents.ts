
import type { BaseEvent } from './BaseEvent';

export type AddInviteLink = BaseEvent & {
  expires: number | 'never';
  maxNumberOfUses: number | 'no limit';
}

export type AddAGate = BaseEvent & {
  chainType: string;
  roleName: string | null;
  numberOfConditions: number;
  accesType: string;
}

export type SettingEventMap = {
  add_invite_link: AddInviteLink;
  add_a_gate: AddAGate;
}
