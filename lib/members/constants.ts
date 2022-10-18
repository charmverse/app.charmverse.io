import type { MemberPropertyType } from '@prisma/client';

export const DEFAULT_MEMBER_PROPERTIES = [
  'profile_pic',
  'name',
  'role',
  'discord',
  'twitter',
  'timezone',
  'bio'
] as const;

export const DefaultMemberPropertyDict: Record<MemberPropertyType, string> = {
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
  url: 'URL',
  wallet_address: 'Wallet address',
  bio: 'Bio'
};
