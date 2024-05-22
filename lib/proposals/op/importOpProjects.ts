import * as http from 'adapters/http';
import { prettyPrint } from 'lib/utils/strings';

export type OPProjectData = {
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

export async function importOpProjects() {
  const limit = 100;
  const offset = 0;
  const projects: OPProjectData[] = [];
  let response = await http.GET<GetRoundProjectsResponse>(baseUrl, { limit, offset }, { headers });
  projects.push(...response.projects);

  while (response.metadata.totalReturned === limit) {
    const nextOffset = response.metadata.nextOffset;
    response = await http.GET<GetRoundProjectsResponse>(baseUrl, { limit, offset: nextOffset }, { headers });
    projects.push(...response.projects);
  }
}

importOpProjects();
