import type { BaseEvent } from './BaseEvent';

export type AddInviteLink = BaseEvent & {
  expires: number | 'never';
  maxNumberOfUses: number | 'no limit';
};

export type AddAGate = BaseEvent & {
  numberOfConditions: number;
  chainType: string | string[];
  accesType: string | string[];
  gateType: string | string[];
};

type AddRoleEvent = BaseEvent & {
  name: string;
};

type UpdateRoleEvent = BaseEvent & {
  name: string;
  createPage: boolean;
  createBounty: boolean;
};

type TokenGateUpdateEvent = BaseEvent & {
  roles: number;
};

export type SettingEventMap = {
  add_invite_link: AddInviteLink;
  delete_invite_link: BaseEvent;
  add_a_gate: AddAGate;
  add_role: AddRoleEvent;
  delete_role: BaseEvent;
  update_role_permissions: UpdateRoleEvent;
  assign_member_role: BaseEvent;
  unassign_member_role: BaseEvent;
  update_token_gate_roles: TokenGateUpdateEvent;
};
