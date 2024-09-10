import { prisma } from '@charmverse/core/prisma-client';

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { difference, uniq } from 'lodash';

const reviewerData = getCsvData<CSVRow>('../__data/optimism/reviewer_allocations.csv');

import { getProjectsFromFile, RetroApplication, fieldIds, spaceId } from './data';

type CSVRow = {
  'Project ID': string;
  'Project Name': string;
  'Reviewer 1': string;
  'Reviewer 2': string;
  'Reviewer 3': string;
  'Reviewer 4': string;
  'Reviewer 5': string;
  'Appeal Reviewer 1': string;
  'Appeal Reviewer 2': string;
  'Appeal Reviewer 3': string;
  'Appeal Reviewer 4': string;
  'Appeal Reviewer 5': string;
};

const spamCheckTitle = 'Automated Requirements Check';
const fullReviewTitle = 'Full Review';

function getCsvData<T>(path: string): T[] {
  return parse(readFileSync(path).toString(), { columns: true }) as T[];
}

async function populateProject(
  csvRow: CSVRow,
  proposalPages: Awaited<ReturnType<typeof getProposals>>,
  emailToUser: Record<string, string>
) {
  const page = proposalPages.find(
    (r) => r.proposal?.formAnswers.find((a) => a.fieldId === fieldIds['Attestation ID'])?.value === csvRow['Project ID']
  );
  if (!page) {
    throw new Error('Proposal not found for ' + csvRow['Project ID']);
  }

  const evaluations = page.proposal?.evaluations;
  const spamCheck = evaluations?.find((e) => e.title === spamCheckTitle);
  const fullReview = evaluations?.find((e) => e.title === fullReviewTitle);
  if (!spamCheck || !fullReview) {
    throw new Error('Evaluation not found ' + fullReview);
  }

  const reviewers = [
    csvRow['Reviewer 1'],
    csvRow['Reviewer 2'],
    csvRow['Reviewer 3'],
    csvRow['Reviewer 4'],
    csvRow['Reviewer 5']
  ].map((email) => emailToUser[email]);
  const appealReviewers = [
    csvRow['Appeal Reviewer 1'],
    csvRow['Appeal Reviewer 2'],
    csvRow['Appeal Reviewer 3'],
    csvRow['Appeal Reviewer 4'],
    csvRow['Appeal Reviewer 5']
  ].map((email) => emailToUser[email]);

  if (!reviewers.every(Boolean)) {
    throw new Error('Reviewer not found for ' + csvRow['Project Name']);
  }
  if (!appealReviewers.every(Boolean)) {
    throw new Error('Appeal Reviewer not found for ' + csvRow['Project Name']);
  }

  return {
    proposalId: page.proposal!.id,
    title: page.title,
    fullReview,
    spamCheck,
    reviewers,
    appealReviewers
  };
}

async function createUsers(userEmails: string[]) {
  for (const email of userEmails) {
    console.log(
      'created user',
      await prisma.user.create({
        data: {
          email,
          username: email,
          path: email.split('@')[0] + '-' + Math.random().toString().split('.')[1].slice(0, 5),
          spaceRoles: {
            create: {
              spaceId
            }
          },
          verifiedEmails: {
            create: {
              avatarUrl: '',
              name: '',
              email
            }
          }
        }
      })
    );
  }
  // for (const email of verifiedEmails) {
  //   console.log(
  //     await prisma.spaceRole.upsert({
  //       where: {
  //         spaceUser: {
  //           userId: email.userId,
  //           spaceId
  //         }
  //       },
  //       create: {
  //         userId: email.userId,
  //         spaceId
  //       },
  //       update: {}
  //     })
  //   );
  // }
}

function getReviewerEmails(): string[] {
  return uniq(
    reviewerData
      .map((r) => {
        return [
          r['Reviewer 1'],
          r['Reviewer 2'],
          r['Reviewer 3'],
          r['Reviewer 4'],
          r['Reviewer 5'],
          r['Appeal Reviewer 1'],
          r['Appeal Reviewer 2'],
          r['Appeal Reviewer 3'],
          r['Appeal Reviewer 4'],
          r['Appeal Reviewer 5']
        ];
      })
      .flat()
      .map((str) => str.trim().toLowerCase())
  );
}

async function assignRole(roleId = 'ae8c0881-10cd-465a-8435-ef69a5d2d040') {
  const userEmails = getReviewerEmails();
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          verifiedEmails: {
            some: {
              email: {
                in: userEmails
              }
            }
          }
        },
        { email: { in: userEmails } }
      ]
    },
    include: {
      spaceRoles: {
        include: {
          spaceRoleToRole: true
        }
      },
      verifiedEmails: true
    }
  });
  console.log('found', userEmails.length, 'emails');
  console.log('found', users.length, 'users');
  const members = users.filter((user) => user.spaceRoles.some((role) => role.spaceId === spaceId));
  console.log('found', members.length, 'members');
  console.log(
    'missing member',
    difference(
      userEmails,
      members.map((m) => m.verifiedEmails[0].email)
    )
  );
  console.log(
    'missing role',
    users.filter((user) => !user.spaceRoles.some((role) => role.spaceRoleToRole.some((c) => c.roleId === roleId)))
      .length
  );

  for (const user of users) {
    const spaceRole = user.spaceRoles.find((role) => role.spaceId === spaceId);
    if (spaceRole) {
      const hasRole = spaceRole.spaceRoleToRole.some((c) => c.roleId === roleId);
      if (!hasRole) {
        console.log('assigning role to', user.verifiedEmails[0].email);
        await prisma.spaceRoleToRole.create({
          data: {
            spaceRoleId: spaceRole.id,
            roleId
          }
        });
      }
    }
  }

  // const role = await prisma.role.findUniqueOrThrow({
  //   where: {
  //     id: roleId
  //   },
  //   include: {
  //     spaceRolesToRole: {
  //       include: {
  //         spaceRole: true
  //       }
  //     }
  //   }
  // });
  // const reviewers = await prisma.proposalReviewer.findMany({
  //   where: {
  //     proposal: {
  //       spaceId
  //     }
  //   }
  // });
}

function getProposals() {
  return prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      createdAt: {
        gt: new Date(2024, 8, 10)
      }
    },
    include: {
      proposal: {
        include: {
          evaluations: true,
          formAnswers: true
        }
      }
    }
  });
}

async function importReviewers() {
  // Note: file path is relative to CWD
  const projects = reviewerData;
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    }
  });
  const dbProjects = await getProposals();
  const reviewerEmails = getReviewerEmails();
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        {
          verifiedEmails: {
            some: {
              email: {
                in: reviewerEmails
              }
            }
          }
        },
        { email: { in: reviewerEmails } }
      ]
    },
    include: {
      spaceRoles: true,
      verifiedEmails: true
    }
  });

  // Ensure that reviewers are already added as members of the space. Otherwise, run 'createUsers' function
  const notInDb = reviewerEmails.filter((email) => !users.some((u) => u.verifiedEmails.some((e) => e.email === email)));
  if (notInDb.length) {
    throw new Error('Not all reviewer emails have been added to the database: ' + notInDb.join(', '));
  }
  const notInSpace = users.filter((user) => !user.spaceRoles.some((role) => role.spaceId === spaceId));
  if (notInSpace.length) {
    throw new Error('Not all reviewers have been added to the space: ' + notInSpace.map((u) => u.username).join(', '));
  }

  const emailToUser = users.reduce<Record<string, string>>((acc, user) => {
    if (user.email) {
      acc[user.email] = user.id;
    }
    for (const email of user.verifiedEmails.map((e) => e.email)) {
      acc[email] = user.id;
    }
    return acc;
  }, {});

  const populatedProjects = await Promise.all(projects.map((p) => populateProject(p, dbProjects, emailToUser)));

  console.log('Processing', populatedProjects.length, 'projects...');

  for (const project of populatedProjects) {
    if (['f908d29b-c563-4422-a69f-83a62feb85db', 'f6452631-4675-4d1a-bb25-95d2d1c85751'].includes(project.proposalId)) {
      continue;
    }
    console.log('processing', project.proposalId, project.title);
    await prisma.$transaction([
      prisma.proposal.update({
        where: {
          id: project.proposalId
        },
        data: {
          status: 'published'
        }
      }),
      prisma.proposalEvaluation.update({
        where: {
          id: project.spamCheck.id
        },
        data: {
          result: 'pass',
          completedAt: new Date(),
          decidedBy: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835' // chris id
        }
      }),
      prisma.proposalEvaluationReview.create({
        data: {
          result: 'pass',
          evaluationId: project.spamCheck.id,
          completedAt: new Date(),
          reviewerId: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835' // chris id
        }
      }),
      prisma.proposalReviewer.deleteMany({
        where: { proposalId: project.proposalId, evaluationId: project.fullReview.id }
      }),
      prisma.proposalAppealReviewer.deleteMany({
        where: { proposalId: project.proposalId, evaluationId: project.fullReview.id }
      }),
      prisma.proposalReviewer.createMany({
        data: project.reviewers.map((userId) => {
          return {
            proposalId: project.proposalId!,
            evaluationId: project.fullReview.id,
            userId: userId
          };
        })
      }),
      prisma.proposalAppealReviewer.createMany({
        data: project.appealReviewers.map((userId) => {
          return {
            proposalId: project.proposalId!,
            evaluationId: project.fullReview.id,
            userId: userId
          };
        })
      })
    ]);

    if (populatedProjects.indexOf(project) % 10 === 0) {
      console.log('Processed', populatedProjects.indexOf(project), 'projects');
    }
  }
  console.log('Done!');
}

importReviewers().catch((e) => {
  console.error('Error crashed script', e);
  process.exit(1);
});

// createUsers(['']).catch((e) => {
//   console.error('Error crashed script', e);
//   process.exit(1);
// });
