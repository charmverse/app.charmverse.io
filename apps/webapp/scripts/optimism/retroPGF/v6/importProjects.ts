import { uuid } from '@bangle.dev/utils';
import type { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { FarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import { getFarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import { createDraftProposal } from '../../../../lib/proposals/createDraftProposal';
import { publishProposal } from '../../../../lib/proposals/publishProposal';
import { upsertProposalFormAnswers } from '@packages/lib/proposals/forms/upsertProposalFormAnswers';

import { appendFileSync } from 'fs';
import { RateLimit } from 'async-sema';
import type { FieldAnswerInput } from '@packages/lib/proposals/forms/interfaces';
import { charmValues, charmValue, charmLinks } from './utils';
import {
  spaceId,
  templateId,
  fieldIds,
  RetroApplication,
  getProjectsFromFile,
  farcasterUsersFile,
  savedFarcasterProfiles,
  applicationsFile
} from './data';

// 50 requests/minute for Public tier - https://www.ankr.com/docs/rpc-service/service-plans/#rate-limits
const rateLimiter = RateLimit(1);

function _getFormAnswers({
  attestationId,
  category,
  projectDescriptionOptions,
  project,
  impactStatementAnswer
}: RetroApplication): FieldAnswerInput[] {
  const funding = project.funding.map(
    (funding) =>
      `${funding.amount || 'N/A'} - ${
        funding.details?.trim() ||
        (funding.fundingRound && `Funding Round ${funding.fundingRound}`) ||
        funding.grantUrl ||
        funding.type
      }`
  );
  const rewards = project.rewards.map((reward) => `${reward.amount} - ${`Round ${reward.roundId}`}`);
  const orgTeamAdmin = project.organization?.organization.team.find((member) => member.role === 'admin');
  const teamMember = project.team[0];
  const matchingTeamMember = project.team.find((member) => member.fid.toString() === orgTeamAdmin?.user.farcasterId);
  const answers = [
    {
      fieldId: fieldIds.Name,
      value: project.name
    },
    {
      fieldId: fieldIds.Description,
      value: charmValue(project.description)
    },
    {
      fieldId: fieldIds['Category'], // project category
      value: project.category
    },
    {
      fieldId: fieldIds['Application Category'],
      value: category.name
    },
    {
      fieldId: fieldIds['Website'],
      value: project.website[0] || ''
    },
    {
      fieldId: fieldIds['Contracts'],
      value: project.website[0] || ''
    },
    {
      fieldId: fieldIds['Rewards'],
      value: charmValues(rewards)
    },
    {
      fieldId: fieldIds['Pricing Model'],
      value: project.pricingModel
    },
    { fieldId: fieldIds['Attestation ID'], value: attestationId },
    { fieldId: fieldIds['Project Description'], value: charmValues(projectDescriptionOptions) },
    { fieldId: fieldIds['Team Leader: Username'], value: orgTeamAdmin?.user.username || teamMember.username },
    { fieldId: fieldIds['Team Leader: Bio'], value: orgTeamAdmin?.user.bio || teamMember?.profile.bio.text },
    {
      fieldId: fieldIds['Team Leader: Follow Count'],
      value: matchingTeamMember?.follower_count || teamMember.follower_count
    },
    {
      fieldId: fieldIds['Team Leader: Following Count'],
      value: matchingTeamMember?.following_count || teamMember.following_count
    },
    {
      fieldId: fieldIds['Github Repos'],
      value: charmLinks(project.repos)
    },
    { fieldId: fieldIds['Funding'], value: charmValues(funding) }
  ];
  impactStatementAnswer.forEach((impactStatement, index) => {
    answers.push({
      // @ts-ignore
      fieldId: fieldIds['Impact Statement ' + (index + 1)],
      value: charmValues([impactStatement.impactStatement.question, '', impactStatement.answer])
    });
  });

  // @ts-ignore
  return answers;
}

async function populateProject(application: RetroApplication) {
  const project = application.project;
  const farcasterIds = project.team.map((member) => member.fid).filter(Boolean);
  if (farcasterIds.length !== project.team.length) {
    throw new Error('Invalid team members: ' + project.id);
  }
  // if (!project.team.some((m) => m.role === 'admin')) {
  //   throw new Error('No team admin: ' + project.id);
  // }
  const farcasterUsers = new Map<string, FarcasterProfile>();
  for (const farcasterId of farcasterIds) {
    const farcasterIdInt = farcasterId;
    const profile = savedFarcasterProfiles.find((u: any) => u.body.id === farcasterIdInt);
    if (profile) {
      farcasterUsers.set(farcasterId.toString(), profile);
      continue;
    }
    console.log('requesting profile', farcasterId);
    await rateLimiter();
    const farcasterProfile = await getFarcasterProfile({ fid: farcasterId });
    if (farcasterProfile) {
      appendFileSync(farcasterUsersFile, JSON.stringify(farcasterProfile) + ',\n');
      farcasterUsers.set(farcasterId.toString(), farcasterProfile);
    } else {
      // throw new Error(`Farcaster profile not found for ${farcasterId}: ` + project.id);
      console.error(`Farcaster profile not found for ${farcasterId}: ` + project.id);
    }
  }
  if (farcasterUsers.size === 0) {
    throw new Error('Not enough [valid] team members for project: ' + project.id);
  }
  const formAnswers = _getFormAnswers(application);
  return { ...project, formAnswers, farcasterUsers };
}

async function importOpProjects() {
  // Note: file path is relative to CWD
  const applications = await getProjectsFromFile(applicationsFile);

  console.log('Processing', applications.length, 'applications...');

  const populated = await Promise.all(applications.map((project) => populateProject(project)));

  for (const project of populated) {
    const authorIds: string[] = [];
    const farcasterIds = project.team.map((member) => member.fid.toString());
    for (const farcasterId of farcasterIds) {
      const farcasterProfile = project.farcasterUsers.get(farcasterId);
      if (!farcasterProfile) {
        console.error(`Farcaster profile not found for ${farcasterId}`);
        continue;
      }

      let userId: string | undefined;

      const connectedAddresses = farcasterProfile.connectedAddresses;

      const charmverseUserWithFarcaster = await prisma.user.findFirst({
        where: {
          farcasterUser: {
            fid: parseInt(farcasterId)
          }
        }
      });
      if (charmverseUserWithFarcaster) {
        userId = charmverseUserWithFarcaster.id;
      } else if (connectedAddresses.length) {
        const charmverseUserWithAddress = await prisma.user.findFirst({
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
        if (charmverseUserWithAddress) {
          userId = charmverseUserWithAddress.id;
        }
      }
      if (!userId) {
        const newUser = await prisma.user.create({
          data: {
            username: farcasterProfile.body.username || farcasterId,
            path: uuid(),
            claimed: false,
            identityType: 'Farcaster',
            wallets: {
              create: connectedAddresses.map((address) => ({
                address
              }))
            },
            farcasterUser: {
              create: {
                fid: parseInt(farcasterId),
                account: farcasterProfile
              }
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
        userId = newUser.id;
      }

      if (userId && authorIds.indexOf(userId) === -1) {
        authorIds.push(userId);
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
      createdBy: authorIds[0],
      spaceId,
      pageType: 'proposal',
      title: project.name,
      templateId,
      authors: authorIds
    });

    await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers: project.formAnswers
    });

    await publishProposal({
      proposalId: proposal.id,
      userId: authorIds[0]
    });
    console.log('Created proposal', page.id, page.title);
  }
  console.log('Done!');
}

importOpProjects().catch((e) => console.error('Error crashed script', e));
