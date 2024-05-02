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

  // for database features
  columnTitle: string;
  columnPropertyId: string;
};

export type ProjectField = keyof ProjectPayload;
export type ProjectMemberField = keyof ProjectMemberPayload;

export type ProjectFieldConfig = {
  required?: boolean;
  show?: boolean;
  private?: boolean;
};

// TODO: use type enums instead of string for the keys
// export type FieldConfig = Partial<Record<ProjectField, ProjectFieldConfig>>;
// export type ProjectMemberFieldConfig = Partial<Record<ProjectMemberField, ProjectFieldConfig>>;
export type FieldConfig = Record<string, ProjectFieldConfig>;
export type ProjectMemberFieldConfig = Record<string, ProjectFieldConfig>;

export type ProjectAndMembersFieldConfig = FieldConfig & {
  projectMember: ProjectMemberFieldConfig;
};

// Project-related columns
export const PROJECT_NAME_ID = '__project_name';
export const PROJECT_EXCERPT_ID = '__project_excerpt';
export const PROJECT_DESCRIPTION_ID = '__project_description';
export const PROJECT_TWITTER_ID = '__project_twitter';
export const PROJECT_WEBSITE_ID = '__project_website';
export const PROJECT_GITHUB_ID = '__project_github';
export const PROJECT_BLOG_ID = '__project_blog';
export const PROJECT_DEMO_URL_ID = '__project_demoUrl';
export const PROJECT_COMMUNITY_URL_ID = '__project_communityUrl';
export const PROJECT_OTHER_URL_ID = '__project_otherUrl';
export const PROJECT_WALLET_ID = '__project_walletAddress';
// project team members
export const PROJECT_MEMBER_NAMES_ID = '__projectMembers_name';
export const PROJECT_MEMBER_WALLETS_ID = '__projectMembers_walletAddress';
export const PROJECT_MEMBER_EMAILS_ID = '__projectMembers_email';
export const PROJECT_MEMBER_TWITTERS_ID = '__projectMembers_twitter';
export const PROJECT_MEMBER_WARPCASTS_ID = '__projectMembers_warpcast';
export const PROJECT_MEMBER_GITHUBS_ID = '__projectMembers_github';
export const PROJECT_MEMBER_LINKEDINS_ID = '__projectMembers_linkedin';
export const PROJECT_MEMBER_TELEGRAMS_ID = '__projectMembers_telegram';
export const PROJECT_MEMBER_OTHER_URLS_ID = '__projectMembers_otherUrl';
export const PROJECT_MEMBER_PREVIOUS_PROJECTS_ID = '__projectMembers_previousProjects';

export const projectMemberFieldProperties: ProjectFieldProperty[] = [
  {
    field: 'name',
    label: 'Name',
    alwaysRequired: true,
    columnTitle: 'Project Members',
    columnPropertyId: PROJECT_MEMBER_NAMES_ID
  },
  {
    field: 'walletAddress',
    label: 'Wallet address',
    allowPrivate: true,
    columnTitle: 'Project Member Wallets',
    columnPropertyId: PROJECT_MEMBER_WALLETS_ID
  },
  {
    field: 'email',
    label: 'Email',
    allowPrivate: true,
    columnTitle: 'Project Member Emails',
    columnPropertyId: PROJECT_MEMBER_EMAILS_ID
  },
  {
    field: 'twitter',
    label: 'X.com',
    columnTitle: 'Project Member X Accounts',
    columnPropertyId: PROJECT_MEMBER_TWITTERS_ID
  },
  {
    field: 'warpcast',
    label: 'Warpcast',
    columnTitle: 'Project Member Warpcast',
    columnPropertyId: PROJECT_MEMBER_WARPCASTS_ID
  },
  {
    field: 'github',
    label: 'GitHub',
    columnTitle: 'Project Member GitHub',
    columnPropertyId: PROJECT_MEMBER_GITHUBS_ID
  },
  {
    field: 'linkedin',
    label: 'LinkedIn',
    columnTitle: 'Project Member LinkedIn',
    columnPropertyId: PROJECT_MEMBER_LINKEDINS_ID
  },
  {
    field: 'telegram',
    label: 'Telegram',
    columnTitle: 'Project Member Telegram',
    columnPropertyId: PROJECT_MEMBER_TELEGRAMS_ID
  },
  {
    field: 'otherUrl',
    label: 'Other URL',
    columnTitle: 'Project Member URL',
    columnPropertyId: PROJECT_MEMBER_OTHER_URLS_ID
  },
  {
    field: 'previousProjects',
    label: 'Previous Projects',
    multiline: true,
    rows: 3,
    columnTitle: 'Project Member Projects',
    columnPropertyId: PROJECT_MEMBER_PREVIOUS_PROJECTS_ID
  }
];

export const projectFieldProperties: ProjectFieldProperty[] = [
  {
    field: 'name',
    label: 'Project Name',
    alwaysRequired: true,
    columnTitle: 'Project',
    columnPropertyId: PROJECT_NAME_ID
  },
  {
    field: 'excerpt',
    label: 'Describe your project in one sentence',
    multiline: true,
    rows: 3,
    columnTitle: 'Project Excerpt',
    columnPropertyId: PROJECT_EXCERPT_ID
  },
  {
    field: 'description',
    label: 'Describe your project in more depth',
    multiline: true,
    rows: 5,
    columnTitle: 'Project Description',
    columnPropertyId: PROJECT_DESCRIPTION_ID
  },
  {
    field: 'twitter',
    label: 'X.com',
    columnTitle: 'Project X Account',
    columnPropertyId: PROJECT_TWITTER_ID
  },
  {
    field: 'website',
    label: 'Website',
    columnTitle: 'Project Website',
    columnPropertyId: PROJECT_WEBSITE_ID
  },
  {
    field: 'github',
    label: 'GitHub',
    columnTitle: 'Project GitHub',
    columnPropertyId: PROJECT_GITHUB_ID
  },
  {
    field: 'blog',
    label: 'Blog',
    columnTitle: 'Blog',
    columnPropertyId: PROJECT_BLOG_ID
  },
  {
    field: 'demoUrl',
    label: 'Product or Demo URL',
    columnTitle: 'Project Demo',
    columnPropertyId: PROJECT_DEMO_URL_ID
  },
  {
    field: 'communityUrl',
    label: 'Community URL (Discord/Discourse/Farcaster channel)',
    columnTitle: 'Project Community',
    columnPropertyId: PROJECT_COMMUNITY_URL_ID
  },
  {
    field: 'otherUrl',
    label: 'Other URL',
    columnTitle: 'Other URL',
    columnPropertyId: PROJECT_OTHER_URL_ID
  },
  {
    field: 'walletAddress',
    label: 'Primary Project Wallet to receive funds',
    allowPrivate: true,
    columnTitle: 'Project Wallet',
    columnPropertyId: PROJECT_WALLET_ID
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
