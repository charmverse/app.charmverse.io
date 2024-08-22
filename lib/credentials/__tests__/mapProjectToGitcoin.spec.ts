import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import { v4 as uuid, v4 } from 'uuid';

import { mapProjectToGitcoin } from '../mapProjectToGitcoin';

describe('mapProjectToGitcoin', () => {
  const createdBy = uuid();

  it('should map the project details correctly', () => {
    const input: ConnectProjectDetails = {
      id: '1',
      name: 'Project X',
      sunnyAwardsNumber: 12,
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
      mintingWalletAddress: '0x8Bc704386DCE0C4f004194684AdC44Edf6e85f07',
      primaryContractAddress: '0x4200000000000000000000000000000000000021',
      primaryContractChainId: 10,
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
          farcasterId: 123,
          name: 'Alice',
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
          farcasterId: 456,
          name: 'Bob',
          userId: null
        }
      ]
    };

    const agoraProjectRefUID = '0xcb23e3db5e22faab1050eacf85d3b5c119cc54afb315e3442ae36c6028bd6147';

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
      fundingSources: [], // Placeholder,
      contracts: [{ chainId: 10, address: input.primaryContractAddress }],
      mintingWalletAddress: input.mintingWalletAddress || '',
      projectReferences: {
        charmverseId: input.id,
        agoraProjectRefUID
      }
    };

    const output = mapProjectToGitcoin({ project: input, agoraProjectRefUID });
    expect(output).toEqual(expectedOutput);
  });
});
