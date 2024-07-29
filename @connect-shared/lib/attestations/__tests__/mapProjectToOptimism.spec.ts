import type { ProjectDetails } from '../mapProjectToOptimism';
import { mapProjectToOptimism } from '../mapProjectToOptimism';

describe('mapProjectToOptimism', () => {
  it('should map the project details correctly', () => {
    const input: ProjectDetails = {
      name: 'Project X',
      category: 'DeFi',
      description: 'A sample project',
      avatar: 'avatar.png',
      coverImage: 'cover.jpg',
      farcasterValues: ['CharmVerse'],
      github: 'https://github.com/projectx',
      twitter: 'https://twitter.com/projectx',
      mirror: 'https://mirror.xyz/projectx',
      websites: ['https://example.com'],
      mintingWalletAddress: null,
      primaryContractAddress: null,
      primaryContractChainId: null,
      primaryContractDeployTxHash: null,
      primaryContractDeployer: null,
      projectMembers: [
        {
          farcasterId: 123
        },
        {
          farcasterId: 456
        }
      ]
    };

    const expectedOutput = {
      name: 'Project X',
      description: 'A sample project',
      projectAvatarUrl: 'avatar.png',
      projectCoverImageUrl: 'cover.jpg',
      category: 'DeFi',
      osoSlug: '', // Placeholder
      socialLinks: {
        website: ['https://example.com'],
        farcaster: ['CharmVerse'],
        twitter: 'https://twitter.com/projectx',
        mirror: 'https://mirror.xyz/projectx'
      },
      team: ['123', '456'],
      github: ['https://github.com/projectx'],
      packages: [], // Placeholder
      contracts: [], // Placeholder
      grantsAndFunding: {
        ventureFunding: [], // Placeholder
        grants: [], // Placeholder
        revenue: [] // Placeholder
      }
    };

    const output = mapProjectToOptimism(input);
    expect(output).toEqual(expectedOutput);
  });
});
