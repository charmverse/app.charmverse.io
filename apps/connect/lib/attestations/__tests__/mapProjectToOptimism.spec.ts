import { v4 as uuid } from 'uuid';

import type { ConnectProjectDetails } from '../../projects/fetchProject';
import { mapProjectToOptimism } from '../mapProjectToOptimism'; // Adjust the import to the actual file location

describe('mapProjectToOptimism', () => {
  it('should map the project details correctly', () => {
    const input: ConnectProjectDetails = {
      id: '1',
      name: 'Project X',
      createdBy: uuid(),
      category: 'DeFi',
      description: 'A sample project',
      avatar: 'avatar.png',
      coverImage: 'cover.jpg',
      farcasterValues: ['CharmVerse'],
      farcasterFrameImage: null,
      github: 'https://github.com/projectx',
      twitter: 'https://twitter.com/projectx',
      mirror: 'https://mirror.xyz/projectx',
      websites: ['https://example.com'],
      path: null,
      projectMembers: [
        {
          farcasterUser: {
            fid: 123,
            pfpUrl: 'https://pfp.url/alice',
            bio: "Alice's bio",
            username: 'alice',
            displayName: 'Alice'
          },
          teamLead: true,
          userId: uuid()
        },
        {
          farcasterUser: {
            fid: 456,
            pfpUrl: 'https://pfp.url/bob',
            bio: "Bob's bio",
            username: 'bob',
            displayName: 'Bob'
          },
          teamLead: false,
          userId: uuid()
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
      team: ['Alice', 'Bob'],
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
