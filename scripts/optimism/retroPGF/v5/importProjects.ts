import { uuid } from '@bangle.dev/utils';
import type { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { FarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { createDraftProposal } from '../../../../lib/proposals/createDraftProposal';
import { publishProposal } from '../../../../lib/proposals/publishProposal';
import { upsertProposalFormAnswers } from 'lib/forms/upsertProposalFormAnswers';

import { appendFileSync } from 'fs';
import { RateLimit } from 'async-sema';
import type { FieldAnswerInput } from 'lib/forms/interfaces';
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

function _getFormAnswers({ category, project, impactStatementAnswer }: RetroApplication): FieldAnswerInput[] {
  const funding = project.funding.map(
    (funding) =>
      `${funding.amount || 'N/A'} - ${
        funding.details?.trim() ||
        (funding.fundingRound && `Funding Round ${funding.fundingRound}`) ||
        funding.grantUrl ||
        funding.type
      }`
  );
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
      fieldId: fieldIds['Category'],
      value: category.name
    },
    {
      fieldId: fieldIds['Project Website Field'],
      value: project.website[0] || ''
    },
    { fieldId: fieldIds['Project Pricing Model'], value: project.pricingModel },
    { fieldId: fieldIds['Project Pricing Model Details'], value: charmValue(project.pricingModelDetails) },
    { fieldId: fieldIds['Attestation ID'], value: project.id },
    { fieldId: fieldIds['Additional Links'], value: charmLinks(project.links) },
    { fieldId: fieldIds['Funding Received'], value: charmValues(funding) }
  ];

  (
    [
      'Impact Statement: How has the infrastructure you built enabled the testing, deployment, and operation of OP chains?',
      'Impact Statement: Who has used your tooling and how has it benefited them?',
      'Impact Statement: How does your project support, or is a dependency of, the OP Stack?',
      'Impact Statement: How has your project advanced the development of the OP Stack?',
      'Impact Statement: Who has benefited the most from your work on the OP Stack and how?'
    ] as const
  ).forEach((key) => {
    const value = impactStatementAnswer.find((a) =>
      a.impactStatement.question.includes(key.replace('Impact Statement: ', ''))
    )?.answer;
    answers.push({
      fieldId: fieldIds[key] as any,
      value: charmValue(value)
    });
  });

  return answers;
}

async function populateProject(application: RetroApplication) {
  const project = application.project;
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
    if (farcasterProfile) {
      appendFileSync(farcasterUsersFile, JSON.stringify(farcasterProfile) + ',\n');
      farcasterUsers.set(farcasterId, farcasterProfile);
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
    const farcasterIds = project.team.map((member) => member.user.farcasterId);
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
