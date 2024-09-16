import { readFile } from 'fs/promises';

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

// dev
// export const spaceId = 'e9923c04-9001-429b-8e52-69293d62cf12';
// export const templateId = '762064ff-2430-4a7c-bfa5-7e54dc51f19a';

// production
export const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';
export const templateId = '762064ff-2430-4a7c-bfa5-7e54dc51f19a';

// Local storage for Farcaster profiles
export const farcasterUsersFile = '../__data/optimism/archive/farcaster-profiles.json';
export const savedFarcasterProfiles = JSON.parse(readFileSync(farcasterUsersFile).toString());

export const applicationsFile = '../__data/optimism/RPGF5 applications.json';

// Schema for the JSON file provided by Optimism
export type RetroApplication = {
  category: {
    name: string;
  };
  project: {
    id: string; // attesation id
    name: string;
    description: string;
    website: string[];
    pricingModel: string;
    pricingModelDetails: string;

    organization: {
      organization: {
        id: string;
        name: string;
        description: string;
      };
    } | null;

    // note: url may be empty string, so filter those out
    repos: { url: string }[];

    team: {
      role: 'admin' | 'member';
      userId?: string;
      user: {
        email: string | null;
        farcasterId: string;
      };
    }[];
    funding: {
      type: string;
      grant: string;
      grantUrl: string;
      amount: string;
      fundingRound: string | null;
      details: string | null; // "Funding received from Alien Capital, Founders' personal ";
      receivedAt: string;
    }[];
    links: {
      url: string;
      name: string;
    }[];
  };
  impactStatementAnswer: { answer: string; impactStatement: { question: string } }[];
};

export function getProjectsFromFile(filePath: string): Promise<RetroApplication[]> {
  return readFile(filePath).then((response) => JSON.parse(response.toString()));
}

export const fieldIds = {
  Name: '60f2d651-59b5-4f0d-81df-e53ff1b68ca1',
  Category: '98ab627b-7e88-4611-b327-f4fc4f5798c4',
  Description: 'c913c37e-f844-4cf5-ba41-262c53dec371',
  'Project Website Field': '13b17cd1-a519-4f30-acfc-8bf4303e8791',
  'Impact Statement: How has the infrastructure you built enabled the testing, deployment, and operation of OP chains?':
    'f2872c44-c43d-472c-9425-d04186000e4e',
  'Impact Statement: Who has used your tooling and how has it benefited them?': '2de2aeed-0edf-47ed-bb12-01f227f24e84',
  'Impact Statement: How does your project support, or is a dependency of, the OP Stack?':
    'c65d8a0b-9427-4382-9c06-f09bdc018461',
  'Impact Statement: How has your project advanced the development of the OP Stack?':
    '11ca8c9e-f0e7-4f46-af68-b382f82f51af',
  'Project Pricing Model Details': '18cb586b-1914-4c92-9108-44504d5d90bc',
  'Impact Statement: Who has benefited the most from your work on the OP Stack and how?':
    '609eba50-1eb9-41bc-bb5b-5e68da17e485',
  'Project Pricing Model': '9c89cff5-37ba-4366-9ed8-78bb3f295917',
  'Funding Received': 'b67d9a01-7e3b-4cb3-90b1-02ea684a7f43',
  'Attestation ID': '5ba1196b-3adf-4653-9e98-1bd566880b91', // the project id
  'Additional Links': '2c2a4640-0c6c-419a-bd2c-23130c389cde',
  'Github Repos': '93eed6d0-7c30-46b6-a345-c230f7b5f76e',
  'Organization ID': '38c925cc-d384-4059-bc7a-9192e40bf415',
  'Organization Name': '7d3c99fb-fcf6-4e56-9b18-a1995e7bde16',
  'Organization Description': '5c3d7340-db22-419d-b821-3dc4459ceed1'
} as const;

export function getCsvData<T>(path: string): T[] {
  return parse(readFileSync(path).toString(), { columns: true }) as T[];
}
