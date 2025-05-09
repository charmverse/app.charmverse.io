import type {
  FarcasterUser,
  MemberProperty,
  MemberPropertyPermission,
  MemberPropertyType,
  MemberPropertyValue,
  Role,
  Space,
  User,
  UserDetails,
  VisibilityView
} from '@charmverse/core/prisma';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';

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
  required: boolean;
};

export type PropertyValueWithDetails = PropertyValue & PropertyValueDetails;

export type Social = {
  twitterURL?: string;
  githubURL?: string;
  discordUsername?: string;
  linkedinURL?: string;
};

export type Member = Pick<User, 'id' | 'createdAt' | 'updatedAt' | 'username'> & {
  avatar?: string;
  isBot?: boolean;
  path: string;
  deletedAt?: Date;
  avatarTokenId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
  joinDate: string;
  hasNftAvatar?: boolean;
  profile?: Omit<UserDetails, 'social'> & { social: Social | null };
  properties: PropertyValueWithDetails[];
  roles: Pick<Role, 'name' | 'id'>[];
  onboarded: boolean;
  searchValue: string;
  farcasterUser?: {
    username: string;
  };
};

export type CreateMemberPropertyPayload = Pick<MemberProperty, 'index' | 'name' | 'options' | 'type'>;
export type UpdateMemberPropertyValuePayload = Pick<MemberPropertyValue, 'memberPropertyId' | 'value'>;

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
