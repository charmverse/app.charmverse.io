import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import { v4 as uuid, v4 } from 'uuid';

import { mapProjectToGitcoin } from '../mapProjectToGitcoin';

describe('mapProjectToGitcoin', () => {
  const createdBy = uuid();

  it('should map the project details correctly', () => {
    const input: ConnectProjectDetails = {
      id: '1',
      name: 'Project X',
      createdBy,
      optimismCategory: null,
      sunnyAwardsCategory: null,
      description: 'A sample project',
      avatar: 'avatar.png',
      coverImage: 'cover.jpg',
      farcasterValues: ['value1', 'value2'],
      farcasterFrameImage: null,
      github: 'https://github.com/projectx',
      twitter: 'https://twitter.com/projectx',
      websites: ['https://example.com'],
      path: null,
      mintingWalletAddress: null,
      primaryContractAddress: null,
      primaryContractChainId: null,
      sunnyAwardsProjectType: null,
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
          userId: createdBy
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
          userId: v4()
        }
      ]
    };

    const expectedOutput = {
      name: 'Project X',
      bio: 'A sample project',
      websiteUrl: 'https://example.com',
      payoutAddress: '', // Placeholder
      contributionDescription: 'A sample project',
      impactDescription: '', // Placeholder
      impactCategory: [], // Placeholder
      contributionLinks: [
        {
          description: 'Github Repository',
          type: 'Github repo',
          url: 'https://github.com/projectx'
        },
        {
          description: 'Twitter Profile',
          type: 'Other',
          url: 'https://twitter.com/projectx'
        },
        {
          description: 'Website',
          type: 'Other',
          url: 'https://example.com'
        }
      ],
      impactMetrics: [], // Placeholder
      fundingSources: [] // Placeholder
    };

    const output = mapProjectToGitcoin({ project: input });
    expect(output).toEqual(expectedOutput);
  });
});
