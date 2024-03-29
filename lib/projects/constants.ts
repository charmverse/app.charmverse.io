import type { ProjectFieldConfig, ProjectFieldProperty, ProjectValues } from './interfaces';

export const projectMemberFieldProperties: ProjectFieldProperty[] = [
  {
    field: 'name',
    label: 'Name',
    strictlyRequired: true
  },
  {
    field: 'walletAddress',
    label: 'Wallet Address'
  },
  {
    field: 'twitter',
    label: 'Twitter'
  },
  {
    field: 'warpcast',
    label: 'Warpcast'
  },
  {
    field: 'github',
    label: 'GitHub'
  },
  {
    field: 'linkedin',
    label: 'LinkedIn'
  },
  {
    field: 'email',
    label: 'Email'
  },
  {
    field: 'telegram',
    label: 'Telegram'
  },
  {
    field: 'otherUrl',
    label: 'Other URL'
  },
  {
    field: 'previousProjects',
    label: 'Previous Projects',
    multiline: true,
    rows: 3
  }
];

export const projectFieldProperties: ProjectFieldProperty[] = [
  {
    field: 'name',
    label: 'Project Name',
    strictlyRequired: true
  },
  {
    field: 'excerpt',
    label: 'Describe your project in one sentence',
    multiline: true,
    rows: 3
  },
  {
    field: 'description',
    label: 'Describe your project in more depth',
    multiline: true,
    rows: 5
  },
  {
    field: 'twitter',
    label: 'Twitter'
  },
  {
    field: 'website',
    label: 'Website'
  },
  {
    field: 'github',
    label: 'GitHub'
  },
  {
    field: 'blog',
    label: 'Blog'
  },
  {
    field: 'demoUrl',
    label: 'Product or Demo URL'
  },
  {
    field: 'communityUrl',
    label: 'Community URL (Discord/Discourse/Farcaster channel)'
  },
  {
    field: 'otherUrl',
    label: 'Other URL'
  },
  {
    field: 'walletAddress',
    label: 'Wallet Address to receive funds'
  }
];

export const defaultProjectValues: ProjectValues = {
  name: '',
  excerpt: '',
  description: '',
  twitter: '',
  website: '',
  github: '',
  blog: '',
  demoUrl: '',
  communityUrl: '',
  otherUrl: '',
  walletAddress: '',
  projectMembers: [
    {
      name: '',
      walletAddress: '',
      email: '',
      twitter: '',
      warpcast: '',
      github: '',
      linkedin: '',
      telegram: '',
      otherUrl: '',
      previousProjects: ''
    }
  ]
};

export const defaultProjectFieldConfig = {
  name: {
    required: true
  },
  projectMember: {
    name: {
      required: true
    }
  }
} as ProjectFieldConfig;
