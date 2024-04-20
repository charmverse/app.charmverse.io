import type { ProjectMemberPayload, ProjectPayload } from './interfaces';

export type ProjectFieldProperty = {
  field: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  // This will take precedence over the fieldConfig proposal template author sets
  alwaysRequired?: boolean;
  // This will allow the template author to set the field as private (only visible to authors, reviewers & admins)
  allowPrivate?: boolean;
};

export type ProjectField = keyof ProjectPayload;
export type ProjectMemberField = keyof ProjectMemberPayload;

export type ProjectFieldConfig = {
  required?: boolean;
  show?: boolean;
  private?: boolean;
};

export type FieldConfig = Partial<Record<string, ProjectFieldConfig>>;

export type ProjectAndMembersFieldConfig = FieldConfig & {
  projectMember: FieldConfig;
};

export const projectMemberFieldProperties: ProjectFieldProperty[] = [
  {
    field: 'name',
    label: 'Name',
    alwaysRequired: true
  },
  {
    field: 'walletAddress',
    label: 'Wallet Address',
    allowPrivate: true
  },
  {
    field: 'email',
    label: 'Email',
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
    alwaysRequired: true
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
    label: 'Primary Project Wallet to receive funds',
    allowPrivate: true
  }
];

export function createDefaultProjectAndMembersFieldConfig(): ProjectAndMembersFieldConfig {
  return {
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
  } as ProjectAndMembersFieldConfig;
}

export function getFieldConfig(field?: ProjectFieldConfig): ProjectFieldConfig {
  return {
    show: true,
    required: true,
    private: false,
    ...field
  };
}
