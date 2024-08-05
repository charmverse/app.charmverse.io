import type { MemberPropertyType } from '@charmverse/core/prisma';

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
    label: 'X',
    default: true,
    readonly: true
  },
  linked_in: {
    label: 'LinkedIn',
    default: true,
    readonly: true
  },
  github: {
    label: 'GitHub',
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
  farcaster: {
    label: 'Farcaster',
    default: true,
    hidden: true
  },
  google: {
    label: 'Google',
    default: true,
    hidden: true
  },
  wallet: {
    label: 'Wallet',
    default: true,
    hidden: true
  },
  telegram: {
    label: 'Telegram',
    default: true,
    hidden: true
  },
  email: {
    label: 'Email'
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
  multiselect: {
    label: 'Multi-select'
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

export const PREMIUM_MEMBER_PROPERTIES: MemberPropertyType[] = ['role'];

export const NON_DEFAULT_MEMBER_PROPERTIES = propertyTypes.filter((prop) => !DEFAULT_MEMBER_PROPERTIES.includes(prop));
