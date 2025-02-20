import type { ProjectDetails } from '../../../packages/credentials/src/mapProjectToOptimism';
import { mapProjectToOptimism } from '../../../packages/credentials/src/mapProjectToOptimism';

describe('mapProjectToOptimism', () => {
  it('should map the project details correctly', () => {
    const input: ProjectDetails = {
      name: 'Project X',
      optimismCategory: 'DeFi',
      description: 'A sample project',
      avatar: 'avatar.png',
      coverImage: 'cover.jpg',
      farcasterValues: ['CharmVerse'],
      github: 'https://github.com/projectx',
      twitter: 'https://x.com/projectx',
      websites: ['https://example.com'],
      mintingWalletAddress: null,
      primaryContractAddress: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
      primaryContractChainId: 1,
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
        twitter: 'https://x.com/projectx',
        mirror: null
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
