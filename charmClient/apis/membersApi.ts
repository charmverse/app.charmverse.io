import type { MemberProperty } from '@prisma/client';

import * as http from 'adapters/http';
import type { Member, MemberPropertyValuesBySpace, PropertyValueWithDetails, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

export class MembersApi {
  getMembers (spaceId: string, search?: string) {
    return http.GET<Member[]>(`/api/spaces/${spaceId}/members`, { search });
  }

  getMemberProperties (spaceId: string) {
    return http.GET<MemberProperty[]>(`/api/spaces/${spaceId}/members/properties`);
  }

  createMemberProperty (spaceId: string, property: Partial<MemberProperty>) {
    return http.POST<MemberProperty>(`/api/spaces/${spaceId}/members/properties`, property);
  }

  updateMemberProperty (spaceId: string, { id, ...property }: Partial<MemberProperty> & { id: string }) {
    return http.PUT<MemberProperty>(`/api/spaces/${spaceId}/members/properties/${id}`, property);
  }

  deleteMemberProperty (spaceId: string, id: string) {
    return http.DELETE<MemberProperty>(`/api/spaces/${spaceId}/members/properties/${id}`);
  }

  getPropertyValues (memberId: string) {
    return http.GET<MemberPropertyValuesBySpace[]>(`/api/members/${memberId}/values`);
  }

  getSpacePropertyValues (memberId: string, spaceId: string) {
    return http.GET<PropertyValueWithDetails[]>(`/api/members/${memberId}/values/${spaceId}`);
  }

  updateSpacePropertyValues (memberId: string, spaceId: string, updateData: UpdateMemberPropertyValuePayload[]) {
    return http.GET<PropertyValueWithDetails[]>(`/api/members/${memberId}/values/${spaceId}`, updateData);
  }
}
