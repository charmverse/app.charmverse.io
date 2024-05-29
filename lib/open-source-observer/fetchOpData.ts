import { GET } from '@charmverse/core/http';

import { prettyPrint } from 'lib/utils/strings';

type OPProjectData = {
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

/**
 * Docs https://vote.optimism.io/api_v1
 */
export async function fetchOPProjects() {
  const limit = 10;
  const offset = 0;

  const baseUrl = 'https://vote.optimism.io/api/v1/retrofunding/rounds/4/projects';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.AGORA_API_KEY}`
  };
  return GET<GetRoundProjectsResponse>(baseUrl, { limit, offset }, { headers });
}

fetchOPProjects().then(prettyPrint);
