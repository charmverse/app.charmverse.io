import type { MemberProperty, MemberPropertyType, MemberPropertyValue } from '@prisma/client';

import type { PropertyValue } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberProperty[], propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[]): PropertyValue[] {
  return properties.map(({ id, type, name }) => ({
    id,
    type,
    name,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null
  }));
}

export const DEFAULT_MEMBER_PROPERTIES = [
  'profile_pic',
  'name',
  'role',
  'discord',
  'twitter',
  'timezone'
] as const;

export const MemberPropertyTypesLabel: Record<MemberPropertyType, string> = {
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
  wallet_address: 'Wallet address'
};
