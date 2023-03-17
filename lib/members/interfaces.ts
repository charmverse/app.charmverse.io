import type {
  MemberProperty,
  MemberPropertyPermission,
  MemberPropertyType,
  MemberPropertyValue,
  Role,
  Space,
  User,
  UserDetails,
  VisibilityView
} from '@prisma/client';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

export type MemberPropertyValueType = string | number | string[] | null | boolean | Record<string, any>;

export type PropertyValue = {
  memberPropertyId: string;
  value: MemberPropertyValueType;
  spaceId: string;
  spaceName?: string;
  spaceImage?: string | null;
};

export type PropertyValueDetails = {
  type: MemberPropertyType;
  name: string;
  enabledViews: VisibilityView[];
  options?: SelectOptionType[];
};

export type PropertyValueWithDetails = PropertyValue & PropertyValueDetails;

export type Member = Pick<User, 'id' | 'createdAt' | 'updatedAt' | 'username'> & {
  avatar?: string;
  isBot?: boolean;
  path?: string;
  deletedAt?: Date;
  avatarTokenId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
  joinDate: string;
  hasNftAvatar?: boolean;
  profile?: UserDetails;
  properties: PropertyValueWithDetails[];
  roles: Pick<Role, 'name' | 'id'>[];
  onboarded?: boolean;
};

export type CreateMemberPropertyPayload = Pick<MemberProperty, 'index' | 'name' | 'options' | 'type'>;
export type UpdateMemberPropertyValuePayload = Pick<MemberPropertyValue, 'memberPropertyId' | 'value'>;

export type MemberPropertyWithSpace = MemberProperty & {
  space: Space;
};

export type MemberPropertyValuesBySpace = {
  spaceId: string;
  spaceName: string;
  spaceImage: string | null;
  properties: PropertyValueWithDetails[];
};

export type CommonSpacesInput = {
  memberId: string;
  requestingUserId?: string;
  spaceId?: string | undefined;
};

export type CreateMemberPropertyPermissionInput = { memberPropertyId: string; roleId: string };

export type MemberPropertyPermissionWithRole = MemberPropertyPermission & { role: { name: string } | null };

export type MemberPropertyWithPermissions = MemberProperty & {
  permissions: MemberPropertyPermissionWithRole[];
};

export type UpdateMemberPropertyVisibilityPayload = {
  memberPropertyId: string;
  visible: boolean;
  view: VisibilityView;
};
