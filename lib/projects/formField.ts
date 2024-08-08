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
  multiple?: boolean;

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
// export const PROJECT_EXCERPT_ID = '__project_excerpt';
export const PROJECT_DESCRIPTION_ID = '__project_description';
export const PROJECT_TWITTER_ID = '__project_twitter';
export const PROJECT_WEBSITE_ID = '__project_website';
export const PROJECT_GITHUB_ID = '__project_github';
export const PROJECT_WALLET_ID = '__project_walletAddress';
// project team members
export const PROJECT_MEMBER_NAMES_ID = '__projectMembers_name';
export const PROJECT_MEMBER_WALLETS_ID = '__projectMembers_walletAddress';
export const PROJECT_MEMBER_EMAILS_ID = '__projectMembers_email';
export const PROJECT_MEMBER_SOCIAL_URLS_ID = '__projectMembers_socialUrls';

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
    field: 'socialUrls',
    label: 'Social Links',
    multiple: true,
    columnTitle: 'Project Member URL',
    columnPropertyId: PROJECT_MEMBER_SOCIAL_URLS_ID
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
    field: 'description',
    label: 'Describe your project',
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
    field: 'github',
    label: 'GitHub',
    columnTitle: 'Project GitHub',
    columnPropertyId: PROJECT_GITHUB_ID
  },
  {
    field: 'websites',
    label: 'Websites',
    multiple: true,
    columnTitle: 'Project Websites',
    columnPropertyId: PROJECT_WEBSITE_ID
  },
  {
    field: 'walletAddress',
    label: 'Primary Project Wallet to receive funds',
    allowPrivate: true,
    columnTitle: 'Project Wallet',
    columnPropertyId: PROJECT_WALLET_ID
  }
];

export function createDefaultProjectAndMembersFieldConfig({
  allFieldsRequired
}: { allFieldsRequired?: boolean } = {}): ProjectAndMembersFieldConfig {
  const config = {
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
  // loop thru project fields
  projectFieldProperties.forEach((field) => {
    config[field.field] = getFieldConfig({
      required: allFieldsRequired || field.alwaysRequired
    });
  });
  // loop thru team member fields
  projectMemberFieldProperties.forEach((field) => {
    config.projectMember[field.field] = getFieldConfig({
      private: field.allowPrivate,
      required: allFieldsRequired || field.alwaysRequired
    });
  });

  return config;
}

export function getFieldConfig(field?: ProjectFieldConfig): ProjectFieldConfig {
  return {
    show: true,
    required: true,
    private: false,
    ...field
  };
}

export const projectFieldColumnIds = projectFieldProperties.map((field) => field.columnPropertyId);
export const projectMemberFieldColumnIds = projectMemberFieldProperties.map((field) => field.columnPropertyId);
