import { prisma } from '@charmverse/core/prisma-client';
import { readFile } from 'fs/promises';
import * as http from '@packages/adapters/http';

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

// const spaceId = 'f46f31d0-faee-4ccc-871c-336f0d4d06ae';
// const templateId = '934084f3-8779-4344-a8a7-19f972f0b379';

// production
export const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';
export const templateId = 'a8ac2799-5c79-45f7-9527-a1d52d717625';

// Local storage for Farcaster profiles
export const farcasterUsersFile = '../optimism-data/farcaster-profiles.json';
export const savedFarcasterProfiles = JSON.parse(readFileSync(farcasterUsersFile).toString());
// console.log('Loaded', savedFarcasterProfiles.length, 'pre-saved farcaster profiles');

type OPProjectDataFromAPI = {
  avatarUrl: string;
  coverImageUrl: string;
  attestationUid: string;
  approvalAttestationUid: string;
  name: string;
  description: string;
  externalLink: string;
  socialLinks: {
    twitter: string;
    farcaster: string;
    mirror: string;
    website: string;
  };
  team: {
    farcasterId: string;
  }[];
  repositories: string[];
  deployedContracts: {
    address: string;
    chainId: string;
    deployer: string;
    creationBlock: string;
    transactionId: string;
    verificationProof: string;
    openSourceObserverSlug: string;
  }[];
  categories: {
    name: string;
    description: string;
  }[];
  funding: {
    ventureCapital: {
      amount: string;
      source: string;
      date: string;
      details: string;
    }[];
    grants: {
      amount: string;
      source: string;
      date: string;
      details: string;
    }[];
    optimismGrants: {
      amount: string;
      source: string;
      date: string;
      details: string;
      link: string;
      type: string;
    }[];
  };
};

export type OPProjectData = {
  thumbnailUrl: string;
  openSourceObserverSlug: string;
  bannerUrl: string;
  id: string;
  name: string;
  description: string;
  farcaster: string[];
  // externalLink: string;
  twitter: string;
  team: {
    role: 'admin' | 'member';
    user: {
      farcasterId: string;
    };
  }[];
  contracts: {
    contractAddress: string;
    chainId: number;
  }[];
  funding: {
    type: 'venture' | 'revenue' | 'other-grant' | 'foundation-grant' | 'token-house-mission' | 'foundation-mission';
    grant: string;
    grantUrl: string;
    amount: string;
    details: string; // "Funding received from Alien Capital, Founders' personal ";
    receivedAt: string;
  }[];
  mirror: string;
  website: string[];
  repos: { id: string; url: string; containsContracts: boolean }[];
  snapshots: { attestationId: string }[];
};

type GetRoundProjectsResponse = {
  metadata: {
    hasNext: boolean;
    totalReturned: number;
    nextOffset: number;
  };
  projects: OPProjectData[];
};

const baseUrl = 'https://vote.optimism.io/api/v1/retrofunding/rounds/4/projects';
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.AGORA_API_KEY}`
};

function _getProjectsFromAPI(): Promise<OPProjectData[]> {
  return http.GET<GetRoundProjectsResponse>(baseUrl, { limit: 100, offset: 0 }, { headers }).then(async (response) => {
    const projects = response.projects;
    while (response.metadata.hasNext) {
      response = await http.GET<GetRoundProjectsResponse>(
        baseUrl,
        { limit: 100, offset: response.metadata.nextOffset },
        { headers }
      );
      projects.push(...response.projects);
    }
    return projects;
  });
}

export function getProjectsFromFile(filePath: string): Promise<OPProjectData[]> {
  return readFile(filePath).then((response) => JSON.parse(response.toString()));
}

function _getFormFields() {
  return prisma.proposal
    .findFirstOrThrow({
      where: {
        page: {
          id: templateId
        }
      },
      include: {
        form: {
          include: {
            formFields: true
          }
        }
      }
    })
    .then((p) => p.form?.formFields || []);
}

export const fieldIds = {
  Name: '91529538-a9e7-45dd-baa1-896abe81be61',
  Description: 'a95596eb-da28-4aa1-9429-e97d3e5ca782',
  'External Link': 'efb10679-dc7d-44cc-ab0a-2ee321c4307b',
  Twitter: '057d88c9-51bf-40b7-9bb5-917b7a1f3bf7',
  Farcaster: '211a27e3-9153-41a3-95b2-14ff121b835f',
  Mirror: '904a9f7b-16f9-49c3-9419-274573989e36',
  website: 'f605a705-6b87-40c3-a40a-888414d10c2b',
  'Github Repo': 'b8048298-bc48-4c98-a7d2-87535ec41da1',
  // 'Venture Funding Amount': '3397e913-e7be-4c34-803d-fa4312d393d9',
  // 'Venture Funding Source': 'be002109-5b18-409c-be97-1f06984255dd',
  // 'Venture Funding Date': '2f67fb54-1351-4a66-994a-a381c00e915d',
  // 'Venture Funding Details': 'a3904afe-a75f-407c-a9de-5117a153dea9',
  // 'Grants Funding Amount': '5d5196b1-beb6-4bdb-b0ff-e558243608e7',
  // 'Grants Funding Source': '2557fd6f-7c1a-4ad9-9942-2b671fe3712d',
  // 'Grants Funding Date': '41eca67a-3272-4667-a964-877000f1ff1b',
  // 'Grants Funding Details': '5541e906-2258-4112-b210-00ecddd4872f',
  // 'Revenue Amount': '7fec8119-c9b5-48f2-8ee5-1b4bd108d277',
  // 'Revenue Source': 'd3cedf22-4d91-4a04-aeed-418efd21721e',
  // 'Revenue Date': '3c633757-99c5-4b74-abf4-9d258f85552d',
  // 'Revenue Details': '8b4e0790-5143-46cc-84b7-1e8371e94f99',
  // 'Other Grants Amount': 'b7c12963-bb7b-493a-baa7-8780a556ff70',
  // 'Other Grants Source': '4be6a12d-bc99-42cf-87b1-de3562a18f1c',
  // 'Other Grants Date': '6f5cfeb1-7a59-471d-83ef-f9daef5bbd3d',
  // 'Other Grants Details': '47004e0c-aa3f-40f5-8506-77b87322726c',
  // 'Optimism Grants Amount': '7db510d2-a5bb-4f69-b240-94773f6b85ca',
  // 'Optimism Grants Source': '275cca74-0fd6-4aad-b0af-e927469f4e72',
  // 'Optimism Grants Date': 'df3706f9-0ff9-4923-8b0e-50284aab909c',
  // 'Optimism Grants Details': 'b38728c9-2327-4465-8471-64f8b6095cc7',
  'Grant Details': '4b2ae8c7-d86d-4162-a57f-7a26ad1c8f1c',
  'Contracts Address': '8e88a87d-ebf8-4890-9352-c17cff6351be',
  'OSO Slug': '4a57c132-3681-46b6-82cb-6ef2c29e5221'
};

// const formFields = [
//   {
//     id: '91529538-a9e7-45dd-baa1-896abe81be61',
//     type: 'short_text',
//     index: 0,
//     name: 'Name',
//   },
//   {
//     id: 'a95596eb-da28-4aa1-9429-e97d3e5ca782',
//     type: 'long_text',
//     index: 1,
//     name: 'Description',
//   },
//   {
//     id: 'efb10679-dc7d-44cc-ab0a-2ee321c4307b',
//     type: 'url',
//     index: 2,
//     name: 'External Link',
//   },
//   {
//     id: '1f7cbedd-0ea7-49a2-b00a-ffcae3c1b784',
//     type: 'label',
//     index: 3,
//     name: 'Social Links',
//   },
//   {
//     id: '057d88c9-51bf-40b7-9bb5-917b7a1f3bf7',
//     type: 'url',
//     index: 4,
//     name: 'Twitter',
//   },
//   {
//     id: '211a27e3-9153-41a3-95b2-14ff121b835f',
//     type: 'url',
//     index: 5,
//     name: 'Farcaster',
//   }
//   {
//     id: '904a9f7b-16f9-49c3-9419-274573989e36',
//     type: 'url',
//     name: 'Mirror'
//   },
//   {
//     id: 'f605a705-6b87-40c3-a40a-888414d10c2b',
//     type: 'url',
//     name: 'website'
//   },
//   {
//     id: 'b8048298-bc48-4c98-a7d2-87535ec41da1',
//     type: 'long_text',
//     name: 'Github Repo'
//   },
//   {
//     type: 'label',
//     index: 8,
//     name: 'Repositories'
//   },
//   {
//     type: 'label',
//     index: 10,
//     name: 'Venture Funding'
//   },
//   {
//     id: '3397e913-e7be-4c34-803d-fa4312d393d9',
//     type: 'short_text',
//     index: 11,
//     name: 'Amount'
//   },
//   {
//     id: 'be002109-5b18-409c-be97-1f06984255dd',
//     type: 'short_text',
//     index: 12,
//     name: 'Source'
//   },
//   {
//     id: '2f67fb54-1351-4a66-994a-a381c00e915d',
//     type: 'date',
//     index: 13,
//     name: 'Date'
//   },
//   {
//     id: 'a3904afe-a75f-407c-a9de-5117a153dea9',
//     type: 'long_text',
//     index: 14,
//     name: 'Details'
//   },
//   {
//     type: 'label',
//     index: 15,
//     name: 'Grants Funding'
//   },
//   {
//     id: '5d5196b1-beb6-4bdb-b0ff-e558243608e7',
//     type: 'number',
//     index: 16,
//     name: 'Amount'
//   },
//   {
//     id: '2557fd6f-7c1a-4ad9-9942-2b671fe3712d',
//     type: 'short_text',
//     index: 17,
//     name: 'Source'
//   },
//   {
//     id: '41eca67a-3272-4667-a964-877000f1ff1b',
//     type: 'date',
//     index: 18,
//     name: 'Date'
//   },
//   {
//     id: '5541e906-2258-4112-b210-00ecddd4872f',
//     type: 'long_text',
//     index: 19,
//     name: 'Details'
//   },
//   {
//     type: 'label',
//     index: 20,
//     name: 'Contracts'
//   },
//   {
//     id: '8e88a87d-ebf8-4890-9352-c17cff6351be',
//     type: 'long_text',
//     index: 21,
//     name: 'contract address',
//   },
// ];

export function getCsvData<T>(path: string): T[] {
  return parse(readFileSync(path).toString(), { columns: true }) as T[];
}
