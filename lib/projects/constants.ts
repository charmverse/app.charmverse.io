import type { ProjectFieldConfig, ProjectFieldProperty, ProjectValues } from './interfaces';

export const projectMemberFieldProperties: ProjectFieldProperty[] = [
  {
    field: 'name',
    label: 'Name',
    strictlyRequired: true
  },
  {
    field: 'walletAddress',
    label: 'Wallet Address',
    allowPrivate: true
  },
  {
    field: 'twitter',
    label: 'X.com'
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
    label: 'Email',
    allowPrivate: true
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
    label: 'X.com'
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
    label: 'Wallet Address to receive funds',
    allowPrivate: true
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
  walletAddress: {
    private: true
  },
  projectMember: {
    name: {
      required: true
    },
    email: {
      private: true
    },
    walletAddress: {
      private: true
    }
  }
} as ProjectFieldConfig;
