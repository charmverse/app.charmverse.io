import type { MemberPropertyType } from '@prisma/client';

type MemberPropertyConfig = {
  label: string;
  hidden?: boolean;
  readonly?: boolean;
  default?: boolean;
  unhideable?: boolean;
};

// the following properties are listed in the order they should appear in the UI. Chronological sort is guaranteed since es2015
export const MEMBER_PROPERTY_CONFIG: Record<MemberPropertyType, MemberPropertyConfig> = {
  profile_pic: {
    label: 'Avatar',
    default: true,
    readonly: true,
    unhideable: true
  },
  name: {
    label: 'Name',
    default: true,
    unhideable: true
  },
  role: {
    label: 'Roles',
    default: true,
    readonly: true
  },
  bio: {
    label: 'Bio',
    default: true,
    readonly: true
  },
  discord: {
    label: 'Discord',
    default: true,
    readonly: true
  },
  twitter: {
    label: 'Twitter',
    default: true,
    readonly: true
  },
  timezone: {
    label: 'Timezone',
    default: true,
    readonly: true
  },
  join_date: {
    label: 'Join date',
    default: true,
    readonly: true,
    hidden: true
  },
  email: {
    label: 'Email'
  },
  multiselect: {
    label: 'Multi-select'
  },
  number: {
    label: 'Number'
  },
  phone: {
    label: 'Phone'
  },
  select: {
    label: 'Select'
  },
  text: {
    label: 'Text'
  },
  text_multiline: {
    label: 'Multiline text'
  },
  url: {
    label: 'URL'
  }
};

const propertyTypes = Object.keys(MEMBER_PROPERTY_CONFIG) as MemberPropertyType[];

export const READONLY_MEMBER_PROPERTIES = propertyTypes.filter((prop) => MEMBER_PROPERTY_CONFIG[prop].readonly);

export const HIDDEN_MEMBER_PROPERTIES = propertyTypes.filter((prop) => MEMBER_PROPERTY_CONFIG[prop].hidden);

export const DEFAULT_MEMBER_PROPERTIES = propertyTypes.filter((prop) => MEMBER_PROPERTY_CONFIG[prop].default);
