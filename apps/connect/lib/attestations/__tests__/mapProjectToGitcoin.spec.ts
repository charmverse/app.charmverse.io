import type { ConnectProjectDetails } from '@connect/lib/projects/fetchProject';
import { v4 as uuid } from 'uuid';

import { mapProjectToGitcoin } from '../mapProjectToGitcoin';

describe('mapProjectToGitcoin', () => {
  const createdBy = uuid();

  it('should map the project details correctly', () => {
    const input: ConnectProjectDetails = {
      id: '1',
      name: 'Project X',
      createdBy,
      category: 'DeFi',
      description: 'A sample project',
      avatar: 'avatar.png',
      coverImage: 'cover.jpg',
      farcasterValues: ['value1', 'value2'],
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
          }
        },
        {
          farcasterUser: {
            fid: 456,
            pfpUrl: 'https://pfp.url/bob',
            bio: "Bob's bio",
            username: 'bob',
            displayName: 'Bob'
          }
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
          description: 'Mirror Profile',
          type: 'Other',
          url: 'https://mirror.xyz/projectx'
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
