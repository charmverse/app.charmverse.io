import * as http from 'adapters/http';

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

const mockData: GetRoundProjectsResponse = {
  metadata: {
    hasNext: true,
    totalReturned: 1,
    nextOffset: 1
  },
  projects: [
    {
      avatarUrl: 'string',
      coverImageUrl: 'string',
      attestationUid: '0x42004661285881D4B0F245B1eD3774d8166CF314',
      approvalAttestationUid: 'string',
      name: 'Mock project',
      description: 'Mock description',
      externalLink: 'https://flipliquid.xyz',
      socialLinks: {
        twitter: '@flip_liquide',
        farcaster: '@flip-liquid',
        mirror: '',
        website: 'flipliquid.xyz'
      },
      team: [
        {
          farcasterId: '@flip-liquid'
        }
      ],
      repositories: ['https://github.com/voteagora/agora-next'],
      deployedContracts: [
        {
          address: '0xcDF27F107725988f2261Ce2256bDfCdE8B382B10',
          chainId: '10',
          deployer: '0x42004661285881D4B0F245B1eD3774d8166CF314',
          creationBlock: '71801427',
          transactionId: '0x6ff5f386e46b2fb0099a78429ecd104f552fe545c65d51068098211d8b11560d',
          verificationProof: 'trust me ;)',
          openSourceObserverSlug: '---'
        }
      ],
      categories: [
        {
          name: 'string',
          description: 'string'
        }
      ],
      funding: {
        ventureCapital: [
          {
            amount: '1000000000 Double Dollars',
            source: 'Weyland-Yutani Venture Capital',
            date: '2024-04-20',
            details: 'Seed round'
          }
        ],
        grants: [
          {
            amount: '100 ETH',
            source: 'Ethereum Foundation',
            date: '2024-04-20',
            details: 'For being nice with it'
          }
        ],
        optimismGrants: [
          {
            amount: '2000000000 OP',
            source: 'OP Foundation',
            date: '2024-04-20',
            details: 'Great job!',
            link: '---',
            type: 'DEVELOPMENT'
          }
        ]
      }
    }
  ]
};

export async function getOpProjects(): Promise<OPProjectData[]> {
  const agoraApiKey = process.env.AGORA_API_KEY;
  if (!agoraApiKey) {
    return mockData.projects;
  }
  const baseUrl = 'https://vote.optimism.io/api/v1/projects';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${agoraApiKey}`
  };
  const limit = 100;
  let response = await http.GET<GetRoundProjectsResponse>(baseUrl, { limit, offset: 0 }, { headers });
  const projects = response.projects;
  while (response.projects.length === limit) {
    response = await http.GET<GetRoundProjectsResponse>(
      baseUrl,
      { limit, offset: response.metadata.nextOffset },
      { headers }
    );
    projects.push(...response.projects);
  }
  return projects;
}
