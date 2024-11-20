import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@root/lib/utils/strings';
import {uniqueValues} from '@packages/utils/array';

const spaceDomain = 'op-grants';
const summaryFile = './op-reviewer-stats.csv';


const steps = [
  'intake',
  'superchainRubric', // Intake OR Superchain Rubric
  'final' // Final OR Superchain Grant Approval
] as const;

type StepType = (typeof steps)[number];

async function loadProposals() {

  const {id: spaceId} = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    },
    select: {
      id: true
    }
  })


  const allProposals = await prisma.proposal.findMany({
    take: 10,
    where: {
      status: 'published',
      spaceId,
      archived: false,
      page: {
        // Buffer to account for timezone differences for range July 18 - Nov 20
        createdAt: {
          gte: new Date('2024-07-17'),
          lte: new Date('2024-11-21')
        },
        type: 'proposal',
        deletedAt: null
      }
    },
    select: {
      id: true,
      page: {
        select: {
          path: true,
          comments: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          rubricAnswers: true,
          reviewers: {
            select: {
              userId: true,
              role: {
                select: {
                  spaceRolesToRole: {
                    select: {
                      spaceRole: {
                        select: {
                          userId: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  username: true,
                  spaceRoles: {
                    select: {
                      spaceRoleToRole: {
                        select: {
                          roleId: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          appealReviews: true
        }
      }
    }
  });

  type ProposalStep = (typeof allProposals)[number]['evaluations'][number];

  type StepRecord = Record<StepType, ProposalStep>

  const invalidProposals = [];

  const mappedProposals: ((typeof allProposals)[number] & {steps: StepRecord})[] = allProposals.map((proposal) => {
    let intakeStap: ProposalStep | undefined;
    let superchainRubricStep: ProposalStep | undefined;
    let finalStep: ProposalStep | undefined

    proposal.evaluations.forEach((evaluation) => {
      if (evaluation.title.toLowerCase().match('intake')) {
        intakeStap = evaluation;
      } else if (evaluation.title.toLowerCase().match('superchain rubric') || evaluation.title.toLowerCase().match('superchain rubric')) {
        superchainRubricStep = evaluation;
      } else if (evaluation.title.toLowerCase().match('final') || evaluation.title.toLowerCase().match('grant approval')) {
        finalStep = evaluation;
      }
    });
    const missingSteps: StepType[] = [];

    if (!intakeStap) {
      missingSteps.push('intake');
    }
    if (!superchainRubricStep) {
      missingSteps.push('superchainRubric');
    }
    if (!finalStep) {
      missingSteps.push('final');
    }

    if (missingSteps.length) {
      if (missingSteps[0] === 'superchainRubric' && missingSteps.length === 1) {
        // Ignore, as we don't need superchainRubric for all proposals
      } else {
        invalidProposals.push(proposal.id);
        log.info(`\r\nProposal ${proposal.id} is missing steps ${missingSteps.join(', ')}.\nhttps://app.charmverse.io/${spaceDomain}/${proposal.page?.path}\r\nHere are its steps: ${proposal.evaluations.map((evaluation) => evaluation.title).join(', ')}\r\n`);
        return null;
      }

    }

    return {
      ...proposal,
      steps: {
        intake: intakeStap,
        superchainRubric: superchainRubricStep,
        final: finalStep
      }
    }
  }).filter(Boolean) as ((typeof allProposals)[number] & {steps: StepRecord})[];

  log.info(`Invalid proposals: ${invalidProposals.length}`);

  return mappedProposals;
}

type ReviewerStats = {
  // First group of stats
  declinedOnIntake: number;
  commentedWhenDeclinedOnIntake: number;
  // Second group of stats
  rubricAnswers: number;
  rubricAnswersWithComment: number;
  // Third group of stats
  uniqueProposalPagesCommented: number;
  totalProposalPageComments: number;
  // // Fourth group of stats
  // workspaceOpens: number;
  // averageWorkspaceOpensWeekly: number;
  // // Fifth group of stats
  totalReviewsDelayed: number;
  intakeStepsDelayed: number;
  superchainRubricStepsDelayed: number;
  finalStepsDelayed: number;
}

const columnOrder: (keyof ReviewerStats)[] = [
  'declinedOnIntake',
  'commentedWhenDeclinedOnIntake',
  'rubricAnswers',
  'rubricAnswersWithComment',
  'uniqueProposalPagesCommented',
  'totalProposalPageComments',
  // 'workspaceOpens',
  // 'averageWorkspaceOpensWeekly',
  'totalReviewsDelayed',
  'intakeStepsDelayed',
  'superchainRubricStepsDelayed',
  'finalStepsDelayed'
];


async function exportSummary() {

  const allProposals = await loadProposals();

  console.log('Total proposals:', allProposals.length);


  console.log(`All ${allProposals.length}`);

  const reviewerMap: Record<string, ReviewerStats> = {};


  for (const proposal of allProposals) {

    const intakeStep = proposal.steps.intake;

    const uniqueReviewerUserIds = uniqueValues(intakeStep.reviewers.map((reviewer) => reviewer.userId ? reviewer.userId : reviewer.role?.spaceRolesToRole.map((spaceRoleToRole) => spaceRoleToRole.spaceRole.userId)).flat().filter(Boolean)) as string[];

    for (const userId of uniqueReviewerUserIds) {

      // Initialise user --------------------------
      if (!reviewerMap[userId]) {
        reviewerMap[userId] = {
          commentedWhenDeclinedOnIntake: 0,
          declinedOnIntake: 0,
          rubricAnswers: 0,
          rubricAnswersWithComment: 0,
          totalProposalPageComments: 0,
          uniqueProposalPagesCommented: 0,
          finalStepsDelayed: 0,
          intakeStepsDelayed: 0,
          superchainRubricStepsDelayed: 0,
          totalReviewsDelayed: 0
        }
      }

      // Intake stats --------------------------
      const userIntakeReview = intakeStep.reviews.find((review) => review.reviewer.id === userId);

      if (userIntakeReview && userIntakeReview.result === 'fail') {
        reviewerMap[userId].declinedOnIntake++;

        const commentedWhenDeclined = !!userIntakeReview.declineMessage
        if (commentedWhenDeclined) {
          reviewerMap[userId].commentedWhenDeclinedOnIntake++;
        }
      }

      // Rubric stats --------------------------
      const allUserRubricAnswers = [...proposal.steps.intake.rubricAnswers, ...proposal.steps.superchainRubric.rubricAnswers, ...proposal.steps.final.rubricAnswers];

      reviewerMap[userId].rubricAnswers += allUserRubricAnswers.length;
      reviewerMap[userId].rubricAnswersWithComment += allUserRubricAnswers.filter((answer) => !!answer.comment).length;


      // Page Comment stats --------------------------
      const userProposalComments = proposal.page!.comments.filter((comment) => comment.createdBy === userId).length;

      if (userProposalComments) {
        reviewerMap[userId].uniqueProposalPagesCommented++;
        reviewerMap[userId].totalProposalPageComments += userProposalComments;
      }


      // Delayed steps stats --------------------------
      if (!userIntakeReview) {
        reviewerMap[userId].intakeStepsDelayed++;
        reviewerMap[userId].totalReviewsDelayed++;
      }

      // Only count superchainRubric if intake failed
      if (proposal.steps.superchainRubric && proposal.steps.intake.result === 'fail' && !proposal.steps.superchainRubric.rubricAnswers.some((review) => review.userId === userId)) {
        reviewerMap[userId].superchainRubricStepsDelayed++;
        reviewerMap[userId].totalReviewsDelayed++;
      }

      // Only count final if intake failed
      if (proposal.steps.final && proposal.steps.intake.result === 'fail' && !proposal.steps.final.rubricAnswers.some((review) => review.userId === userId)) {
        reviewerMap[userId].superchainRubricStepsDelayed++;
        reviewerMap[userId].totalReviewsDelayed++;
      }
    }

    //   const reviewerId = reviewers.userId;
    //   reviewerMap[reviewerId] = reviewerMap[reviewerId] || {
    //     declinedOnIntake: 0,
    //     commentedWhenDeclinedOnIntake: 0,
    //     rubricAnswers: 0,
    //     rubricAnswersWithComment: 0,
    //     uniqueProposalPagesCommented: 0,
    //     totalProposalPageComments: 0,
    //     // workspaceOpens: 0,
    //     // averageWorkspaceOpensWeekly: 0,
    //     // totalReviewsDelayed: 0,
    //     // intakeStepsDelayed: 0,
    //     // superchainRubricStepsDelayed: 0,
    //     // finalStepsDelayed: 0
    //   };
    //   reviewerMap[reviewerId].rubricAnswers += intakeStep.reviews.length;
    //   reviewerMap[reviewerId].rubricAnswersWithComment += intakeStep.reviews.filter((review) => review.comment).length;

  }



  //

//   for (const proposal of proposals) {
//     for (const evaluation of proposalOfProposals.evaluations) {
//       for (const review of evaluation.reviews) {
//         const reviewerId = review.reviewer.id;
//         reviewerMap[reviewerId] = reviewerMap[reviewerId] || {
//           declinedOnIntake: 0,
//           commentedWhenDeclinedOnIntake: 0,
//           rubricAnswers: 0,
//           rubricAnswersWithComment: 0,
//           uniqueProposalPagesCommented: 0,
//           totalProposalPageComments: 0,
//           workspaceOpens: 0,
//           averageWorkspaceOpensWeekly: 0,
//           totalReviewsDelayed: 0,
//           intakeStepsDelayed: 0,
//           prelimStepsDelayed: 0,
//           finalStepsDelayed: 0
//         };
//         reviewerMap[reviewerId].rubricAnswers += review.rubricAnswers.length;
//         reviewerMap[reviewerId].rubricAnswersWithComment += review.rubricAnswers.filter((answer) => answer.comment).length;
//       }
//     }
//   }



//   const total = proposals.length;
//   // get count of proposals by reviews
//   const countMap = proposals.reduce<Record<string, number>>((acc, proposal) => {
//     const count = proposal.evaluations
//       .filter((evaluation) => evaluation.title === 'Rule Violation Check')
//       .map((evaluation) => evaluation.appealReviews.length + evaluation.reviews.length)
//       .reduce((acc, count) => acc + count, 0);
//     acc[count] = acc[count] ? acc[count] + 1 : 1;
//     return acc;
//   }, {});

//   const csvData = Object.entries(countMap)
//     .map(([key, value]) => {
//       return {
//         Proposals: value + ' out of ' + total,
//         Reviews: key
//         // Total: total
//       };
//     })
//     .sort((a, b) => parseInt(a.Reviews) - parseInt(b.Reviews));

//   const csvString = stringify(csvData, {
//     delimiter: '\t',
//     header: true,
//     columns: ['Proposals', 'Reviews']
//   });

//   if (csvData.length) {
//     for (const row of csvData) {
//       console.log(row['Proposals'] + ' have ' + row['Reviews'] + ' reviews');
//     }
//     // writeFileSync(summaryFile, csvString);
//   }
// }

// async function exportFullReviewSummary() {
//   const projects = await getProjectsFromFile('../optimism-data/applicants.json');

//   const proposals = await prisma.proposal.findMany({
//     where: {
//       status: 'published',
//       spaceId,
//       archived: false,
//       page: {
//         sourceTemplateId: templateId,
//         deletedAt: null
//       }
//     },
//     include: {
//       page: {
//         select: {
//           path: true,
//           title: true
//         }
//       },
//       evaluations: {
//         include: {
//           reviews: true
//         }
//       }
//     }
//   });
//   const mapped: {
//     'Full Review Status': string;
//     Link: string;
//     'Project Id': string;
//     Rejected: number;
//     'Rejected Reasons': string;
//     Approved: number;
//     Pending: number;
//   }[] = proposals.map((proposal) => {
//     const rawProjects = projects.filter((raw) => raw.name.trim() === proposal.page?.title.trim());
//     if (rawProjects.length !== 1) {
//       console.log('could not find project', rawProjects, proposal.page?.title);
//     }
//     const rawProject = rawProjects[0]?.id;
//     const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
//     const evaluation = proposal.evaluations.find((evaluation) => evaluation.title === 'Full Review');
//     if (!evaluation || !currentEvaluation) throw new Error('missing evaluations?');
//     const isRuleViolation = currentEvaluation.title === 'Rule Violation Check';
//     const approved = evaluation.reviews.filter((review) => review.result === 'pass').length;
//     const rejected = evaluation.reviews.filter((review) => review.result === 'fail').length;
//     const rejectedMessages = uniq(
//       evaluation.reviews
//         .map((review) => review.declineReasons.concat(review.declineMessage || ''))
//         .flat()
//         .filter(Boolean)
//     );
//     let status: string;
//     if (isRuleViolation) {
//       if (currentEvaluation.result === 'pass') {
//         status = 'Passed';
//       } else {
//         status = 'Not started';
//       }
//     } else {
//       if (approved >= 3) {
//         status = 'Passed';
//       } else if (rejected >= 3) {
//         status = 'Rejected';
//       } else {
//         status = 'Pending';
//       }
//     }
//     return {
//       'Full Review Status': status,
//       Link: 'https://app.charmverse.io/op-retrofunding-review-process/' + proposal.page?.path,
//       Rejected: rejected,
//       'Rejected Reasons': rejectedMessages.join(', '),
//       Approved: approved,
//       Pending: 5 - approved - rejected,
//       'Project Id': rawProject || 'N/A'
//     };
//   });

//   const csvData = sortBy(Object.values(mapped), (row) => {
//     const status = row['Full Review Status'];
//     switch (status) {
//       case 'Passed':
//         return 1;
//       case 'Pending':
//         return 2;
//       case 'Not started':
//         return 3;
//       case 'Rejected':
//         return 4;
//       default:
//         return 5;
//     }
//   });

//   const csvString = stringify(csvData, {
//     delimiter: '\t',
//     header: true,
//     columns: ['Project Id', 'Link', 'Full Review Status', 'Approved', 'Rejected', 'Rejected Reasons', 'Pending']
//   });

//   writeFileSync(fullReviewsummaryFile, csvString);
// }

// async function exportReviewers() {
//   const proposals = await prisma.proposal.findMany({
//     where: {
//       status: 'published',
//       spaceId,
//       archived: false,
//       page: {
//         sourceTemplateId: templateId,
//         deletedAt: null
//       }
//     },
//     include: {
//       evaluations: {
//         include: {
//           reviewers: true,
//           appealReviewers: true,
//           reviews: true,
//           appealReviews: true
//         }
//       }
//     }
//   });

//   // get count of reviews by user
//   const countMap = proposals.reduce<Record<string, { proposals: number; reviewed: number }>>((acc, proposal) => {
//     proposal.evaluations
//       .filter((evaluation) => evaluation.title === 'Rule Violation Check')
//       .forEach((evaluation) => {
//         evaluation.reviewers.forEach((reviewer) => {
//           if (reviewer.userId) {
//             acc[reviewer.userId] = acc[reviewer.userId] || { proposals: 0, reviewed: 0 };
//             acc[reviewer.userId].proposals++;
//             if (evaluation.reviews.some((review) => review.reviewerId === reviewer.userId)) {
//               acc[reviewer.userId].reviewed++;
//             }
//           }
//         });
//       });
//     return acc;
//   }, {});

//   const userIds = Object.keys(countMap);
//   const users = await prisma.user.findMany({
//     where: {
//       id: {
//         in: userIds
//       }
//     },
//     include: {
//       verifiedEmails: true
//     }
//   });

//   const csvData = Object.entries(countMap)
//     .map(([key, value]) => {
//       const user = users.find((user) => user.id === key);
//       return {
//         Reviewer: user?.verifiedEmails[0]?.email || user?.username || 'N/A',
//         Reviews: value.reviewed,
//         'Assigned proposals': value.proposals
//       };
//     })
//     .sort((a, b) => b.Reviews - a.Reviews);

//   const csvString = stringify(csvData, {
//     delimiter: '\t',
//     header: true,
//     columns: ['Reviewer', 'Reviews', 'Assigned proposals']
//   });
//   writeFileSync(reviewersFile, csvString);
}

exportSummary().then()
