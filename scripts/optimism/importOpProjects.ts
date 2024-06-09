import { uuid } from '@bangle.dev/utils';
import type { FormField, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { readFile } from 'fs/promises';
import * as http from 'adapters/http';
import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { createDraftProposal } from '../../lib/proposals/createDraftProposal';
import { publishProposal } from '../../lib/proposals/publishProposal';
import { upsertProposalFormAnswers } from 'lib/forms/upsertProposalFormAnswers';

import { _, jsonDoc } from 'lib/prosemirror/builders';
import type { FieldAnswerInput } from 'lib/forms/interfaces';
// const spaceId = 'f46f31d0-faee-4ccc-871c-336f0d4d06ae';
// const templateId = '934084f3-8779-4344-a8a7-19f972f0b379';
// production
const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';
const templateId = 'a8ac2799-5c79-45f7-9527-a1d52d717625';

type OPProjectDataFromAPI = {
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

type OPProjectData = {
  thumbnailUrl: string;
  bannerUrl: string;
  id: string;
  name: string;
  description: string;
  farcaster: string[];
  // externalLink: string;
  twitter: string;
  team: {
    role: 'admin' | 'member';
    user: {
      farcasterId: string;
    };
  }[];
  contracts: {
    contractAddress: string;
    chainId: number;
  }[];
  funding: {
    type: 'venture';
    grant: string;
    grantUrl: string;
    amount: string;
    details: string; // "Funding received from Alien Capital, Founders' personal ";
    createdAt: string;
  }[];
  mirror: string;
  website: string[];
  repos: { id: string; url: string }[];
  snapshots: { attestationId: string }[];
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

function _getProjectsFromAPI(): Promise<OPProjectData[]> {
  return http.GET<GetRoundProjectsResponse>(baseUrl, { limit: 100, offset: 0 }, { headers }).then(async (response) => {
    const projects = response.projects;
    while (response.metadata.hasNext) {
      response = await http.GET<GetRoundProjectsResponse>(
        baseUrl,
        { limit: 100, offset: response.metadata.nextOffset },
        { headers }
      );
      projects.push(...response.projects);
    }
    return projects;
  });
}

function _getProjectsFromFile(filePath: string): Promise<OPProjectData[]> {
  return readFile(filePath).then((response) => JSON.parse(response.toString()));
}

function _getFormFields() {
  return prisma.proposal
    .findFirstOrThrow({
      where: {
        page: {
          id: templateId
        }
      },
      include: {
        form: {
          include: {
            formFields: true
          }
        }
      }
    })
    .then((p) => p.form?.formFields || []);
}

const fieldIds = {
  Name: '91529538-a9e7-45dd-baa1-896abe81be61',
  Description: 'a95596eb-da28-4aa1-9429-e97d3e5ca782',
  'External Link': 'efb10679-dc7d-44cc-ab0a-2ee321c4307b',
  Twitter: '057d88c9-51bf-40b7-9bb5-917b7a1f3bf7',
  Farcaster: '211a27e3-9153-41a3-95b2-14ff121b835f',
  Mirror: '904a9f7b-16f9-49c3-9419-274573989e36',
  website: 'f605a705-6b87-40c3-a40a-888414d10c2b',
  'Github Repo': 'b8048298-bc48-4c98-a7d2-87535ec41da1',
  'Venture Funding Amount': '3397e913-e7be-4c34-803d-fa4312d393d9',
  'Venture Funding Source': 'be002109-5b18-409c-be97-1f06984255dd',
  'Venture Funding Date': '2f67fb54-1351-4a66-994a-a381c00e915d',
  'Venture Funding Details': 'a3904afe-a75f-407c-a9de-5117a153dea9',
  'Grants Funding Amount': '5d5196b1-beb6-4bdb-b0ff-e558243608e7',
  'Grants Funding Source': '2557fd6f-7c1a-4ad9-9942-2b671fe3712d',
  'Grants Funding Date': '41eca67a-3272-4667-a964-877000f1ff1b',
  'Grants Funding Details': '5541e906-2258-4112-b210-00ecddd4872f',
  'Contracts Address': '8e88a87d-ebf8-4890-9352-c17cff6351be'
};

// const formFields = [
//   {
//     id: '91529538-a9e7-45dd-baa1-896abe81be61',
//     type: 'short_text',
//     index: 0,
//     name: 'Name',
//   },
//   {
//     id: 'a95596eb-da28-4aa1-9429-e97d3e5ca782',
//     type: 'long_text',
//     index: 1,
//     name: 'Description',
//   },
//   {
//     id: 'efb10679-dc7d-44cc-ab0a-2ee321c4307b',
//     type: 'url',
//     index: 2,
//     name: 'External Link',
//   },
//   {
//     id: '1f7cbedd-0ea7-49a2-b00a-ffcae3c1b784',
//     type: 'label',
//     index: 3,
//     name: 'Social Links',
//   },
//   {
//     id: '057d88c9-51bf-40b7-9bb5-917b7a1f3bf7',
//     type: 'url',
//     index: 4,
//     name: 'Twitter',
//   },
//   {
//     id: '211a27e3-9153-41a3-95b2-14ff121b835f',
//     type: 'url',
//     index: 5,
//     name: 'Farcaster',
//   }
//   {
//     id: '904a9f7b-16f9-49c3-9419-274573989e36',
//     type: 'url',
//     name: 'Mirror'
//   },
//   {
//     id: 'f605a705-6b87-40c3-a40a-888414d10c2b',
//     type: 'url',
//     name: 'website'
//   },
//   {
//     id: 'b8048298-bc48-4c98-a7d2-87535ec41da1',
//     type: 'long_text',
//     name: 'Github Repo'
//   },
//   {
//     type: 'label',
//     index: 8,
//     name: 'Repositories'
//   },
//   {
//     type: 'label',
//     index: 10,
//     name: 'Venture Funding'
//   },
//   {
//     id: '3397e913-e7be-4c34-803d-fa4312d393d9',
//     type: 'short_text',
//     index: 11,
//     name: 'Amount'
//   },
//   {
//     id: 'be002109-5b18-409c-be97-1f06984255dd',
//     type: 'short_text',
//     index: 12,
//     name: 'Source'
//   },
//   {
//     id: '2f67fb54-1351-4a66-994a-a381c00e915d',
//     type: 'date',
//     index: 13,
//     name: 'Date'
//   },
//   {
//     id: 'a3904afe-a75f-407c-a9de-5117a153dea9',
//     type: 'long_text',
//     index: 14,
//     name: 'Details'
//   },
//   {
//     type: 'label',
//     index: 15,
//     name: 'Grants Funding'
//   },
//   {
//     id: '5d5196b1-beb6-4bdb-b0ff-e558243608e7',
//     type: 'number',
//     index: 16,
//     name: 'Amount'
//   },
//   {
//     id: '2557fd6f-7c1a-4ad9-9942-2b671fe3712d',
//     type: 'short_text',
//     index: 17,
//     name: 'Source'
//   },
//   {
//     id: '41eca67a-3272-4667-a964-877000f1ff1b',
//     type: 'date',
//     index: 18,
//     name: 'Date'
//   },
//   {
//     id: '5541e906-2258-4112-b210-00ecddd4872f',
//     type: 'long_text',
//     index: 19,
//     name: 'Details'
//   },
//   {
//     type: 'label',
//     index: 20,
//     name: 'Contracts'
//   },
//   {
//     id: '8e88a87d-ebf8-4890-9352-c17cff6351be',
//     type: 'long_text',
//     index: 21,
//     name: 'contract address',
//   },
// ];

function _getFormAnswers(project: OPProjectData): FieldAnswerInput[] {
  const ventureFunding = project.funding.find((f) => f.type === 'venture');
  const grantFunding = project.funding.find((f) => f.type !== 'venture');
  const answers: FieldAnswerInput[] = [
    {
      fieldId: fieldIds.Name,
      value: project.name
    },
    {
      fieldId: fieldIds.Description,
      value: {
        content: jsonDoc(_.p(project.description)),
        contentText: project.description || ''
      }
    },
    {
      fieldId: fieldIds['External Link'],
      value: project.website[0]
    },
    {
      fieldId: fieldIds.Twitter,
      value: project.twitter
    },
    {
      fieldId: fieldIds.Farcaster,
      value: project.farcaster[0]
    },
    {
      fieldId: fieldIds.Mirror,
      value: project.mirror
    },
    {
      fieldId: fieldIds.website,
      value: project.website[0]
    },
    {
      fieldId: fieldIds['Github Repo'],
      value: {
        content: project.repos.length ? jsonDoc(...project.repos.map(({ url }) => _.p(url))) : null,
        contentText: project.repos.map(({ url }) => url).join('\n')
      }
    },
    {
      fieldId: fieldIds['Venture Funding Amount'],
      value: ventureFunding?.amount
    },
    {
      fieldId: fieldIds['Venture Funding Source'],
      value: ventureFunding?.grant
    },
    {
      fieldId: fieldIds['Venture Funding Date'],
      value: ventureFunding?.createdAt
    },
    {
      fieldId: fieldIds['Venture Funding Details'],
      value: {
        content: ventureFunding?.details ? jsonDoc(_.p(ventureFunding.details)) : null,
        contentText: ventureFunding?.details
      }
    },
    {
      fieldId: fieldIds['Grants Funding Amount'],
      value: grantFunding?.amount
    },
    {
      fieldId: fieldIds['Grants Funding Source'],
      value: grantFunding?.grantUrl || grantFunding?.grant
    },
    {
      fieldId: fieldIds['Grants Funding Date'],
      value: grantFunding?.createdAt
    },
    {
      fieldId: fieldIds['Grants Funding Details'],
      value: {
        content: grantFunding?.details ? jsonDoc(_.p(grantFunding.details)) : null,
        contentText: grantFunding?.details || ''
      }
    },
    {
      fieldId: fieldIds['Contracts Address'],
      value: {
        content: project.contracts.length
          ? jsonDoc(
              ...project.contracts.map(({ chainId, contractAddress }) => _.p(contractAddress + ' (' + chainId + ')'))
            )
          : null,
        contentText: ''
      }
    }
  ].filter((a) => !!a.value);

  return answers;
}
async function populateProject(project: OPProjectData) {
  const farcasterIds = project.team.map((member) => member.user.farcasterId).filter(Boolean);
  if (farcasterIds.length !== project.team.length) {
    throw new Error('Invalid team members: ' + project.id);
  }
  if (!project.team.some((m) => m.role === 'admin')) {
    throw new Error('No team admin: ' + project.id);
  }
  const farcasterUsers = new Map<string, FarcasterProfile>();
  for (const farcasterId of farcasterIds) {
    console.log('requesting profile', farcasterId);
    const farcasterProfile = await getFarcasterProfile({ fid: farcasterId });
    console.log('retrieved profile', farcasterId);
    if (!farcasterProfile) {
      throw new Error(`Farcaster profile not found for ${farcasterId}: ` + project.id);
    }
    farcasterUsers.set(farcasterId, farcasterProfile);
  }
  const formAnswers = _getFormAnswers(project);
  return { ...project, formAnswers, farcasterUsers };
}

async function importOpProjects() {
  // Note: file path is relative to CWD
  const _projects = await _getProjectsFromFile('./applicants.json');
  const projects = [_projects[1]];

  console.log('Validating', projects.length, 'projects...');

  const populatedProjects = await Promise.all(projects.map((project) => populateProject(project)));

  console.log('Processing', projects.length, 'projects...');

  for (const project of populatedProjects) {
    const authorIds: string[] = [];
    const farcasterIds = project.team.map((member) => member.user.farcasterId);
    for (const farcasterId of farcasterIds) {
      const farcasterProfile = project.farcasterUsers.get(farcasterId);
      if (!farcasterProfile) {
        throw new Error(`Farcaster profile not found for ${farcasterId}`);
      }
      const connectedAddresses = farcasterProfile?.connectedAddresses;
      let charmverseUserWithAddress: User | null = null;

      if (connectedAddresses && connectedAddresses.length) {
        charmverseUserWithAddress = await prisma.user.findFirst({
          where: {
            wallets: {
              some: {
                address: {
                  in: connectedAddresses
                }
              }
            }
          }
        });
      }

      if (!charmverseUserWithAddress) {
        charmverseUserWithAddress = await prisma.user.create({
          data: {
            username: farcasterProfile?.body.username || farcasterId,
            path: uuid(),
            claimed: false,
            identityType: 'Farcaster',
            wallets: {
              create: connectedAddresses.map((address) => ({
                address
              }))
            }
            // spaceRoles: {
            //   create: [
            //     {
            //       spaceId
            //     }
            //   ]
            // }
          }
        });
      }

      if (charmverseUserWithAddress) {
        authorIds.push(charmverseUserWithAddress.id);
      }
    }

    const existingRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId
      },
      select: {
        userId: true
      }
    });
    await prisma.spaceRole.createMany({
      data: authorIds
        .map((authorId) => ({
          isAdmin: false,
          spaceId,
          userId: authorId
        }))
        // filter out users that already have roles
        .filter(({ userId }) => !existingRoles.some((role) => role.userId === userId))
    });

    const { proposal, page } = await createDraftProposal({
      contentType: 'free_form',
      createdBy: authorIds[0],
      spaceId,
      pageType: 'proposal',
      title: project.name,
      templateId,
      authors: authorIds
    });
    console.log('Created proposal', page.id, page.title);

    await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: project.formAnswers
    });

    await publishProposal({
      proposalId: proposal.id,
      userId: authorIds[0]
    });
  }
  console.log('Done!');
}

importOpProjects().catch(console.error);
