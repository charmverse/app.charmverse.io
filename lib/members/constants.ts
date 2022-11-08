import type { MemberPropertyType } from '@prisma/client';

export const READONLY_MEMBER_PROPERTIES: MemberPropertyType[] = [
  'profile_pic',
  'role',
  'discord',
  'twitter',
  'timezone'
];

export const DEFAULT_MEMBER_PROPERTIES = [
  ...READONLY_MEMBER_PROPERTIES,
  'name'
] as const;

export const MEMBER_PROPERTY_LABELS: Record<MemberPropertyType, string> = {
  discord: 'Discord',
  name: 'Name',
  profile_pic: 'Profile pic',
  role: 'Role',
  timezone: 'Timezone',
  twitter: 'Twitter',
  email: 'Email',
  multiselect: 'Multi-select',
  number: 'Number',
  phone: 'Phone',
  select: 'Select',
  text: 'Text',
  text_multiline: 'Multiline text',
  url: 'URL'
};

export const UNHIDEABLE_MEMBER_PROPERTIES = [
  'name',
  'profile_pic'
];
