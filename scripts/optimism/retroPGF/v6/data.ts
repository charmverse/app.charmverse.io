import { readFile } from 'fs/promises';

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

// dev
// export const spaceId = 'b011ccee-1ce1-461f-b15b-90ddc1958c76';
// export const templateId = '58ccc779-7d07-4918-896b-4d19f753ec04';

// production
export const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669'; // op retrofunding space
// Season 4:
// export const templateId = 'a8ac2799-5c79-45f7-9527-a1d52d717625';
// Season 5:
// export const templateId = '762064ff-2430-4a7c-bfa5-7e54dc51f19a';
// Season 6:
export const templateId = '58ccc779-7d07-4918-896b-4d19f753ec04';

// Local storage for Farcaster profiles
export const farcasterUsersFile = '../__data/optimism/farcaster-profiles.json';
export const savedFarcasterProfiles = JSON.parse(readFileSync(farcasterUsersFile).toString());

export const applicationsFile = '../__data/optimism/v6_applications_updated.json';

// Schema for the JSON file provided by Optimism
export type RetroApplication = {
  attestationId: string;
  projectDescriptionOptions: string[];
  impactStatementAnswer: ImpactStatementAnswer[];
  category: Category;
  project: Project;
};

interface ImpactStatementAnswer {
  id: string;
  applicationId: string;
  impactStatementId: string;
  answer: string;
  impactStatement: ImpactStatement;
}

interface ImpactStatement {
  id: string;
  categoryId: string;
  question: string;
  subtext: string;
  isRequired: boolean;
  isMarkdownSupported: boolean;
  roundId: string;
  limitToCategoryOptions: number[];
  selectionOptions: string[];
  category: {
    name: string;
  };
}

interface Category {
  name: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  bannerUrl: string;
  website: any[];
  farcaster: any[];
  twitter: string | null;
  mirror: string | null;
  pricingModel: string;
  pricingModelDetails: string;
  openSourceObserverSlug: string;
  addedTeamMembers: boolean;
  addedFunding: boolean;
  hasCodeRepositories: boolean;
  isOnChainContract: boolean;
  lastMetadataUpdate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  team: TeamMember[];
  organization: { organization: Organization } | null;
  repos: any[];
  contracts: any[];
  funding: Funding[];
  rewards: Reward[];
  links: any[];
}

interface TeamMember {
  object: string;
  fid: number;
  custody_address: string;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  active_status: string;
  power_badge: boolean;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  coverUrl: string;
  website: any[];
  farcaster: any[];
  twitter: string;
  mirror: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  team: OrganizationTeamMember[];
}

interface OrganizationTeamMember {
  id: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  organizationId: string;
  user: User;
}

interface User {
  id: string;
  name: string;
  username: string;
  farcasterId: string;
  imageUrl: string;
  bio: string;
  email: string;
  emailVerified: boolean;
  github: string | null;
  notDeveloper: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Funding {
  id: string;
  type: string;
  grant: string | null;
  grantUrl: string | null;
  amount: string;
  receivedAt: string;
  details: string | null;
  fundingRound: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

interface Reward {
  id: string;
  roundId: string;
  projectId: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}

export function getProjectsFromFile(filePath: string): Promise<RetroApplication[]> {
  return readFile(filePath).then((response) => JSON.parse(response.toString()));
}

export const fieldIds = {
  Funding: 'b0df0892-649b-4468-80ce-a441bf695432',
  Contracts: '43f8c716-4af6-4930-80ef-c0a8562f847a',
  Rewards: '0967cb32-fd71-487f-940d-6a76c6a32754',
  'Pricing Model': '34df8d8c-a0cb-40c6-bcf1-a200b533ac3a',
  'Application Category': '6025bc08-ace0-4def-9232-d1d8e5e3627e',
  'Attestation Details': '36e5cdc8-c505-4741-8493-da0f27fb8849',
  'Attestation ID': 'fd72c90a-4b0e-4033-9215-8fba4e079b85',
  'Impact Statements': 'b997177d-ab6f-42bb-b62f-4d62e7ac5115',
  'Project Description': '3fb397a2-d5ff-471e-8830-29296c34154d',
  'Impact Statement 1': 'fd1cf023-80b0-484f-9058-945894f67f0f',
  'Impact Statement 2': '0085b16f-c346-4950-b833-f180718ba0f4',
  'Impact Statement 3': 'c22250d2-0b12-4896-9a5a-12d325b96f26',
  'Project Details': '90682677-9d15-42b8-b880-913278254a02',
  Name: 'c96fa28b-c85a-4144-9764-d882e56ed58f',
  Description: '62249571-38ce-41ce-813a-c61abe17fdf6',
  Website: 'c4257de0-3834-4c94-9819-544cd07a7456',
  Category: 'c0526ea3-e9b5-4779-9085-84390cb97776',
  'Team Leader: Username': 'cf424298-bbe5-4d48-8d35-b79fafddbb67',
  'Team Leader: Bio': 'b2734da4-d8c3-4c26-82a2-3d9585933e4c',
  'Team Leader: Follow Count': '567f20fa-8106-4b5c-a541-c94e5a1d1588',
  'Team Leader: Following Count': 'ede8e434-9353-4db0-98e7-4bb30656e696',
  'Github Repos': '545a2ea5-1968-4a6f-8ba0-83f2ebad1467'
} as const;

export function getCsvData<T>(path: string): T[] {
  return parse(readFileSync(path).toString(), { columns: true }) as T[];
}
