import type { MemberPropertyType, User, UserDetails } from '@prisma/client';

export type MemberPropertyValueType = string | number | string[] | null | boolean | Record<string, any>;

export type PropertyValue = {
  id: string;
  value: MemberPropertyValueType;
  // TODO - we might not need props below
  type: MemberPropertyType;
  name: string;
}

export type Member = Omit<User, 'addresses'> & {
  isAdmin: boolean;
  joinDate: string;
  hasNftAvatar?: boolean;
  profile: UserDetails | null;
  properties: PropertyValue[];
}
