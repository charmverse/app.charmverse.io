import type { MemberProperty } from '@prisma/client';

import * as http from 'adapters/http';
import type {
  CreateMemberPropertyPermissionInput,
  Member,
  MemberPropertyPermissionWithRole,
  MemberPropertyValuesBySpace,
  MemberPropertyWithPermissions,
  PropertyValueWithDetails,
  UpdateMemberPropertyValuePayload,
  UpdateMemberPropertyVisibilityPayload
} from 'lib/members/interfaces';
import type { GuestToRemove } from 'lib/members/removeMember';

export class MembersApi {
  getMembers(spaceId: string, search?: string) {
    return http.GET<Member[]>(`/api/spaces/${spaceId}/members`, { search });
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

  removeGuest({ spaceId, userId }: GuestToRemove) {
    return http.POST<{ success: true }>(`/api/spaces/${spaceId}/members/remove-guest`, { userId });
  }
}
