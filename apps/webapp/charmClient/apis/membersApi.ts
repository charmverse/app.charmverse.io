import type { MemberProperty } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';
import type {
  CreateMemberPropertyPermissionInput,
  Member,
  MemberPropertyPermissionWithRole,
  MemberPropertyValuesBySpace,
  MemberPropertyWithPermissions,
  PropertyValueWithDetails,
  UpdateMemberPropertyValuePayload,
  UpdateMemberPropertyVisibilityPayload
} from '@packages/lib/members/interfaces';
import type { RemoveMemberInput } from '@packages/lib/members/removeMember';

import type { IUser } from 'components/common/DatabaseEditor/user';

export class MembersApi {
  getMembers(spaceId: string, search?: string) {
    return http.GET<Member[]>(`/api/spaces/${spaceId}/members`, { search });
  }

  async getWorkspaceUsers(spaceId: string): Promise<IUser[]> {
    const members = await this.getMembers(spaceId);

    return members.map((member) => ({
      id: member.id,
      username: member.username,
      email: '',
      props: {},
      create_at: new Date(member.createdAt).getTime(),
      update_at: new Date(member.updatedAt).getTime(),
      is_bot: false
    }));
  }

  getMemberProperties(spaceId: string) {
    return http.GET<MemberPropertyWithPermissions[]>(`/api/spaces/${spaceId}/members/properties`);
  }

  createMemberProperty(spaceId: string, property: Partial<MemberProperty>) {
    return http.POST<MemberProperty>(`/api/spaces/${spaceId}/members/properties`, property);
  }

  updateMemberProperty(spaceId: string, { id, ...property }: Partial<MemberProperty> & { id: string }) {
    return http.PUT<MemberProperty>(`/api/spaces/${spaceId}/members/properties/${id}`, property);
  }

  deleteMemberProperty(spaceId: string, id: string) {
    return http.DELETE<{ success: 'ok' }>(`/api/spaces/${spaceId}/members/properties/${id}`);
  }

  getPropertyValues(memberId: string) {
    return http.GET<MemberPropertyValuesBySpace[]>(`/api/members/${memberId}/values`);
  }

  getSpacePropertyValues(memberId: string, spaceId: string) {
    return http.GET<PropertyValueWithDetails[]>(`/api/members/${memberId}/values/${spaceId}`);
  }

  updateSpacePropertyValues(memberId: string, spaceId: string, updateData: UpdateMemberPropertyValuePayload[]) {
    return http.PUT<PropertyValueWithDetails[]>(`/api/members/${memberId}/values/${spaceId}`, updateData);
  }

  createMemberPropertyPermission(spaceId: string, permission: CreateMemberPropertyPermissionInput) {
    return http.POST<MemberPropertyPermissionWithRole>(
      `/api/spaces/${spaceId}/members/properties/permissions`,
      permission
    );
  }

  deleteMemberPropertyPermission(spaceId: string, permissionId: string) {
    return http.DELETE<{ success: 'ok' }>(`/api/spaces/${spaceId}/members/properties/permissions`, { permissionId });
  }

  updateMemberPropertyVisibility(spaceId: string, payload: UpdateMemberPropertyVisibilityPayload) {
    return http.PUT<{ success: 'ok' }>(`/api/spaces/${spaceId}/members/properties/visibility`, payload);
  }

  updateMemberRole({
    spaceId,
    userId,
    isAdmin,
    isGuest
  }: {
    spaceId: string;
    userId: string;
    isAdmin: boolean;
    isGuest: boolean;
  }) {
    return http.PUT<Member[]>(`/api/spaces/${spaceId}/members/${userId}`, { isAdmin, isGuest });
  }

  removeMember({ spaceId, userId }: RemoveMemberInput) {
    return http.DELETE(`/api/spaces/${spaceId}/members/${userId}`);
  }

  banMember({ spaceId, userId }: RemoveMemberInput) {
    return http.DELETE(`/api/spaces/${spaceId}/members/${userId}/ban`);
  }
}
