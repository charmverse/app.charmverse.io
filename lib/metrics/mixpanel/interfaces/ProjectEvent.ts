import type { BaseEventWithoutGroup } from './BaseEvent';

export type ProjectAddMemberEvent = BaseEventWithoutGroup & {
  connectedUserId?: string;
  projectId: string;
  email?: string | null;
  walletAddress?: string | null;
};

export type ProjectAddEvent = BaseEventWithoutGroup & {
  name: string;
};

export type ProjectRemoveMemberEvent = BaseEventWithoutGroup & {
  projectId: string;
  projectMemberId: string;
};

export interface ProjectEventMap {
  add_project: ProjectAddEvent;
  add_project_member: ProjectAddMemberEvent;
  remove_project_member: ProjectRemoveMemberEvent;
}
