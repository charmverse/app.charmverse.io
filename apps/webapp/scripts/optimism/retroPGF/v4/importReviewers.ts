import { prisma } from '@charmverse/core/prisma-client';

import { parse } from 'csv-parse/sync';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { difference, uniq } from 'lodash';

const reviewerData = getCsvData<ProposalRow>('../optimism-data/sampled_badgeholder_review_batch2.csv');

// production
const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';

import { getProjectsFromFile, OPProjectData } from './data';

type ProposalRow = {
  'Project ID': string;
  'Rule Violation: Reviewers (2)': string;
  'Full Review: Reviewers (5)': string;
  'Full Review: Appeal Reviewers (5)': string;
};

const spamCheckTitle = 'Automated Requirements Check';
const ruleViolationTitle = 'Rule Violation Check';
const fullReviewTitle = 'Full Review';

function getCsvData<T>(path: string): T[] {
  return parse(readFileSync(path).toString(), { columns: true }) as T[];
}

async function populateProject(raw: OPProjectData, spaceRoles: { userId: string }[]) {
  let projects = await prisma.page.findMany({
    where: {
      spaceId,
      title: raw.name,
      type: 'proposal'
    },
    include: {
      proposal: {
        include: {
          evaluations: true
        }
      }
    }
  });
  let ignore = false;
  // handle a couple proposals with the same title
  if (raw.repos[0]?.url === 'https://github.com/HypoDropCom/hypodropcom') {
    projects = projects.filter((project) => project.path === 'page-1297952999253953');
  } else if (raw.repos[0]?.url === 'https://github.com/HypoDropCom/HypoDrop-NFT') {
    projects = projects.filter((project) => project.path === 'page-8150083804895756');
  }
  if (projects.length !== 1) {
    if (raw.name === 'Test Project') {
      ignore = true;
    } else {
      console.error('Project not found: ' + raw.name + ' ' + projects.length);

      return { ignore: true };
    }
  }
  const reviewerRow = reviewerData.find((r) => r['Project ID'] === raw.id);
  if (!reviewerRow) {
    //console.error('Reviewer row not found: ' + raw.id);
    //console.log(raw.id, raw.name);
    ignore = true;
  }

  const evaluations = projects[0]?.proposal?.evaluations;
  const spamCheck = evaluations?.find((e) => e.title === spamCheckTitle);
  const ruleViolation = evaluations?.find((e) => e.title === ruleViolationTitle);
  const fullReview = evaluations?.find((e) => e.title === fullReviewTitle);
  if (!ruleViolation || !fullReview) {
    throw new Error('Evaluation not found ' + ruleViolation + ' ' + fullReview);
  }
  const providedEmails = !reviewerRow
    ? []
    : uniq(
        reviewerRow['Rule Violation: Reviewers (2)']
          .split(',')
          .concat(reviewerRow['Full Review: Reviewers (5)'].split(','))
          .concat(reviewerRow['Full Review: Appeal Reviewers (5)'].split(','))
          .map((e) => e.trim().toLowerCase())
      );
  const verifiedEmails = await prisma.verifiedEmail.findMany({
    where: {
      email: {
        in: providedEmails
      }
    }
  });
  const members = verifiedEmails.filter((email) => spaceRoles.some((role) => role.userId === email.userId));
  if (!ignore && members.length !== providedEmails.length) {
    console.log(
      'Missing emails',
      providedEmails.filter((email) => !verifiedEmails.some((d) => d.email === email)),
      {
        providedEmails: providedEmails.length,
        members: members.length,
        verifiedEmails: verifiedEmails.length
      }
    );
    throw new Error('Missing members for project');
  }
  return {
    ignore,
    proposalId: projects[0].proposal!.id,
    title: projects[0].title,
    fullReview,
    spamCheck,
    ruleViolation: ruleViolation,
    reviewers: reviewerRow,
    verifiedEmails
  };
}

// async function createUsers() {
//   const reviewerRow = reviewerData
//     .map((r) => {
//       return [
//         ...r['Rule Violation: Reviewers (2)'].split(','),
//         ...r['Full Review: Reviewers (5)'].split(','),
//         ...r['Full Review: Appeal Reviewers (5)'].split(',')
//       ];
//     })
//     .flat()
//     .map((str) => str.trim().toLowerCase());
//   const userEmails = uniq(reviewerRow);
//   // console.log(userEmails);
//   const verifiedEmails = await prisma.verifiedEmail.findMany({
//     where: {
//       email: {
//         in: userEmails
//       }
//     }
//   });
//   const noUser = userEmails.filter((email) => !verifiedEmails.some((d) => d.email === email));
//   for (const email of noUser) {
//     console.log(
//       'created user',
//       await prisma.user.create({
//         data: {
//           email,
//           username: email,
//           path: email.split('@')[0] + '-' + Math.random().toString().split('.')[1].slice(0, 5),
//           spaceRoles: {
//             create: {
//               spaceId
//             }
//           },
//           verifiedEmails: {
//             create: {
//               avatarUrl: '',
//               name: '',
//               email
//             }
//           }
//         }
//       })
//     );
//   }
//   // for (const email of verifiedEmails) {
//   //   console.log(
//   //     await prisma.spaceRole.upsert({
//   //       where: {
//   //         spaceUser: {
//   //           userId: email.userId,
//   //           spaceId
//   //         }
//   //       },
//   //       create: {
//   //         userId: email.userId,
//   //         spaceId
//   //       },
//   //       update: {}
//   //     })
//   //   );
//   // }
// }

function getReviewerEmails(): string[] {
  return uniq(
    reviewerData
      .map((r) => {
        return [
          ...r['Rule Violation: Reviewers (2)'].split(','),
          ...r['Full Review: Reviewers (5)'].split(','),
          ...r['Full Review: Appeal Reviewers (5)'].split(',')
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
      verifiedEmails: {
        some: {
          email: {
            in: userEmails
          }
        }
      }
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

async function importReviewers() {
  // Note: file path is relative to CWD
  const projects = await getProjectsFromFile('../optimism-data/applicants.json');
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    }
  });
  console.log('Validating', projects.length, 'projects...');

  const populatedProjects = await Promise.all(projects.map((p) => populateProject(p, spaceRoles)));
  const validProjects = populatedProjects.filter(
    (p) => !p.ignore && p.proposalId !== '01267758-ffbe-460c-b84e-b5589b60a23b'
  );

  console.log('Processing', validProjects.length, 'projects...');

  for (const project of validProjects) {
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
          id: project.spamCheck!.id
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
          evaluationId: project.spamCheck!.id,
          completedAt: new Date(),
          reviewerId: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835' // chris id
        }
      }),
      prisma.proposalReviewer.createMany({
        data: [
          ...project.reviewers!['Rule Violation: Reviewers (2)'].split(',').map((r) => {
            return {
              proposalId: project.proposalId!,
              evaluationId: project.ruleViolation!.id,
              userId: project.verifiedEmails!.find((e) => e.email === r.trim().toLowerCase())!.userId
            };
          }),
          ...project.reviewers!['Full Review: Reviewers (5)'].split(',').map((r) => {
            return {
              proposalId: project.proposalId!,
              evaluationId: project.fullReview!.id,
              userId: project.verifiedEmails!.find((e) => e.email === r.trim().toLowerCase())!.userId
            };
          })
        ]
      }),
      prisma.proposalAppealReviewer.createMany({
        data: [
          ...project.reviewers!['Full Review: Appeal Reviewers (5)'].split(',').map((r) => {
            return {
              proposalId: project.proposalId!,
              evaluationId: project.fullReview!.id,
              userId: project.verifiedEmails!.find((e) => e.email === r.trim().toLowerCase())!.userId
            };
          })
        ]
      })
    ]);
    if (validProjects.indexOf(project) % 10 === 0) {
      console.log('Processed', validProjects.indexOf(project), 'projects');
    }
  }
  console.log('Done!');
}

importReviewers().catch((e) => {
  console.error('Error crashed script', e);
  process.exit(1);
});

// createUsers().catch((e) => {
//   console.error('Error crashed script', e);
//   process.exit(1);
// });
