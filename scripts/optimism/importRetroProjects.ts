import { uuid } from '@bangle.dev/utils';
import type { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { createDraftProposal } from '../../lib/proposals/createDraftProposal';
import { publishProposal } from '../../lib/proposals/publishProposal';
import { upsertProposalFormAnswers } from 'lib/forms/upsertProposalFormAnswers';

import { appendFileSync } from 'fs';
import { RateLimit } from 'async-sema';
import { _, jsonDoc } from 'lib/prosemirror/builders';
import type { FieldAnswerInput } from 'lib/forms/interfaces';
import {
  spaceId,
  templateId,
  fieldIds,
  OPProjectData,
  getProjectsFromFile,
  farcasterUsersFile,
  savedFarcasterProfiles
} from './retroData';

// 50 requests/minute for Public tier - https://www.ankr.com/docs/rpc-service/service-plans/#rate-limits
const rateLimiter = RateLimit(1);

function _getFormAnswers(project: OPProjectData): FieldAnswerInput[] {
  const ventureFunding = project.funding.find((f) => f.type === 'venture');
  const optimismFunding = project.funding.find(
    (f) => f.type === 'foundation-grant' || f.type === 'token-house-mission'
  );
  const revenueFunding = project.funding.find((f) => f.type !== 'venture');
  const otherGrantFunding = project.funding.find(
    (f) => f !== ventureFunding && f !== optimismFunding && f !== revenueFunding && f !== revenueFunding
  );
  const answers = [
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
      fieldId: fieldIds['Optimism Grants Amount'],
      value: optimismFunding?.amount
    },
    {
      fieldId: fieldIds['Optimism Grants Source'],
      value: optimismFunding?.grantUrl || optimismFunding?.grant
    },
    {
      fieldId: fieldIds['Optimism Grants Date'],
      value: optimismFunding?.createdAt
    },
    {
      fieldId: fieldIds['Optimism Grants Details'],
      value: {
        content: optimismFunding?.details ? jsonDoc(_.p(optimismFunding.details)) : null,
        contentText: optimismFunding?.details
      }
    },
    {
      fieldId: fieldIds['Revenue Amount'],
      value: revenueFunding?.amount
    },
    {
      fieldId: fieldIds['Revenue Source'],
      value: revenueFunding?.grantUrl || revenueFunding?.grant
    },
    {
      fieldId: fieldIds['Revenue Date'],
      value: revenueFunding?.createdAt
    },
    {
      fieldId: fieldIds['Revenue Details'],
      value: {
        content: revenueFunding?.details ? jsonDoc(_.p(revenueFunding.details)) : null,
        contentText: revenueFunding?.details || ''
      }
    },
    {
      fieldId: fieldIds['Other Grants Amount'],
      value: otherGrantFunding?.amount
    },
    {
      fieldId: fieldIds['Other Grants Source'],
      value: otherGrantFunding?.grantUrl || otherGrantFunding?.grant
    },
    {
      fieldId: fieldIds['Other Grants Date'],
      value: otherGrantFunding?.createdAt
    },
    {
      fieldId: fieldIds['Other Grants Details'],
      value: {
        content: otherGrantFunding?.details ? jsonDoc(_.p(otherGrantFunding.details)) : null,
        contentText: otherGrantFunding?.details
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
        contentText: project.contracts
          .map(({ chainId, contractAddress }) => contractAddress + ' (' + chainId + ')')
          .join('\n')
      }
    }
  ].filter((a) => !!a.value) as FieldAnswerInput[];

  return answers;
}
async function populateProject(project: OPProjectData) {
  const farcasterIds = project.team.map((member) => member.user.farcasterId).filter(Boolean);
  if (farcasterIds.length !== project.team.length) {
    throw new Error('Invalid team members: ' + project.id);
  }
  // if (!project.team.some((m) => m.role === 'admin')) {
  //   throw new Error('No team admin: ' + project.id);
  // }
  const farcasterUsers = new Map<string, FarcasterProfile>();
  for (const farcasterId of farcasterIds) {
    const farcasterIdInt = parseInt(farcasterId);
    const profile = savedFarcasterProfiles.find((u: any) => u.body.id === farcasterIdInt);
    if (profile) {
      farcasterUsers.set(farcasterId, profile);
      continue;
    }
    console.log('requesting profile', farcasterId);
    await rateLimiter();
    const farcasterProfile = await getFarcasterProfile({ fid: farcasterId });
    console.log('retrieved profile', farcasterId);
    appendFileSync(farcasterUsersFile, JSON.stringify(farcasterProfile) + ',\n');
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
  const _projects = await getProjectsFromFile('./applicants.json');
  const projects = _projects;

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

// importOpProjects().catch((e) => console.error('Error crashed script', e));
