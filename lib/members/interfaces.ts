import type { MemberProperty, MemberPropertyValue, Role, User, UserDetails } from '@prisma/client';

export type MemberPropertyValueType = string | number | string[] | null | boolean | Record<string, any>;

export type PropertyValue = {
  memberPropertyId: string;
  value: MemberPropertyValueType;
  spaceId: string;
}

export type Member = Omit<User, 'addresses'> & {
  isAdmin: boolean;
  joinDate: string;
  hasNftAvatar?: boolean;
  profile: UserDetails | null;
  properties: PropertyValue[];
  roles: Pick<Role, 'name' | 'id'>[];
}

export type CreateMemberPropertyPayload = Pick<MemberProperty, 'index' | 'name' | 'options' | 'type'>
export type UpdateMemberPropertyValuePayload = Pick<MemberPropertyValue, 'memberPropertyId' | 'value'>
