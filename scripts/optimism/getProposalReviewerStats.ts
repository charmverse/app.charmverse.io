import { log } from '@charmverse/core/log';
import { User, prisma, UserSpaceAction } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@root/lib/utils/strings';
import {humanizeKey} from '@packages/utils/strings';
import {getUniqueWeeksCount} from '@packages/utils/dates';
import {uniqueValues} from '@packages/utils/array';
import fs from 'node:fs';

import { stringify } from 'csv-stringify/sync';

const spaceDomain = 'op-grants';
const summaryFile = './op-reviewer-stats.csv';


const steps = [
  'intake',
  'superchainRubric', // Intake OR Superchain Rubric
  'final' // Final OR Superchain Grant Approval
] as const;

type StepType = (typeof steps)[number];

async function loadProposals(spaceId: string) {

  const allProposals = await prisma.proposal.findMany({
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
  userId: string;
  username: string;
  proposalsReviewed: number;
  // Activity stats
  appLoadedTimes: number;
  uniqueWeeksAppVisited: number;
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
  'userId',
  'username',
  'appLoadedTimes',
  'uniqueWeeksAppVisited',
  'proposalsReviewed',
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

  const {id: spaceId} = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    },
    select: {
      id: true
    }
  })

  const allProposals = await loadProposals(spaceId);

  console.log('Total proposals:', allProposals.length);


  console.log(`All ${allProposals.length} proposals`);

  const reviewerMap: Record<string, ReviewerStats> = {};


  const userProfiles: Record<string, Pick<User, 'id' | 'username'> & {spaceActions: Pick<UserSpaceAction, 'createdAt'>[]}> = {};

  function getReviewerUserIds(reviewer: typeof allProposals[number]['evaluations'][number]['reviewers'][number]) {
    return reviewer.userId ? reviewer.userId : reviewer.role?.spaceRolesToRole.map((spaceRoleToRole) => spaceRoleToRole.spaceRole.userId)
  }


  for (const proposal of allProposals) {

    const intakeStep = proposal.steps.intake;

    const uniqueIntakeReviewerUserIds = uniqueValues(intakeStep.reviewers.map(getReviewerUserIds).flat().filter(Boolean)) as string[];

    const uniqueSuperchainRubricUserIds = uniqueValues((proposal.steps.superchainRubric?.reviewers ?? []).map(getReviewerUserIds).flat().filter(Boolean)) as string[];

    const uniqueFinalStepUserIds = uniqueValues(proposal.steps.final.reviewers.map(getReviewerUserIds).flat().filter(Boolean)) as string[];

    const uniqueReviewerUserIds = uniqueValues([...uniqueIntakeReviewerUserIds, ...uniqueSuperchainRubricUserIds, ...uniqueFinalStepUserIds]);

    const missingUserProfiles = uniqueReviewerUserIds.filter((userId) => !userProfiles[userId]);

    if (missingUserProfiles.length) {
      const profiles = await prisma.user.findMany({
        where: {
          id: {
            in: missingUserProfiles
          }
        },
        select: {
          id: true,
          username: true,
          spaceActions: {
            where: {
              createdAt: {
                gte: new Date('2024-07-17'),
                lte: new Date('2024-11-21')
              },
              spaceId,
              action: 'view_page'
            },
            select: {
              createdAt: true
            }
          },
        }
      });

      profiles.forEach((profile) => {
        userProfiles[profile.id] = profile;
      });
    }

    for (const userId of uniqueReviewerUserIds) {

      // Initialise user --------------------------
      if (!reviewerMap[userId]) {

        const profile = userProfiles[userId];

        const appLoadedTimes = profile.spaceActions.length;

        reviewerMap[userId] = {
          userId,
          username: profile.username,
          appLoadedTimes: appLoadedTimes,
          uniqueWeeksAppVisited: getUniqueWeeksCount(profile.spaceActions.map((action) => action.createdAt)),
          proposalsReviewed: 0,
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

      let reviewedProposal = false;

      // Intake stats --------------------------
      const userIntakeReview = intakeStep.reviews.find((review) => review.reviewer.id === userId);

      if (userIntakeReview) {
        reviewedProposal = true;
      }

      if (userIntakeReview && userIntakeReview.result === 'fail') {
        reviewerMap[userId].declinedOnIntake += 1;

        const commentedWhenDeclined = !!userIntakeReview.declineMessage
        if (commentedWhenDeclined) {
          reviewerMap[userId].commentedWhenDeclinedOnIntake += 1;
        }
      }

      // Rubric stats --------------------------
      const allUserRubricAnswers = [...proposal.steps.intake.rubricAnswers, ...(proposal.steps.superchainRubric?.rubricAnswers ?? []), ...proposal.steps.final.rubricAnswers].filter(a => a.userId === userId);

      reviewerMap[userId].rubricAnswers += allUserRubricAnswers.length;
      reviewerMap[userId].rubricAnswersWithComment += allUserRubricAnswers.filter((answer) => !!answer.comment?.length).length;

      if (allUserRubricAnswers.length) {
        reviewedProposal = true;
      }

      // Page Comment stats --------------------------
      const userProposalComments = proposal.page!.comments.filter((comment) => comment.createdBy === userId).length;

      if (userProposalComments) {
        reviewerMap[userId].uniqueProposalPagesCommented+= 1;
        reviewerMap[userId].totalProposalPageComments += userProposalComments;
      }


      // Delayed steps stats --------------------------
      if (!userIntakeReview) {
        reviewerMap[userId].intakeStepsDelayed += 1;
        reviewerMap[userId].totalReviewsDelayed += 1;
      }

      // Only count superchainRubric if intake passed
      if (proposal.steps.superchainRubric && proposal.steps.intake.result !== 'fail' && !proposal.steps.superchainRubric.rubricAnswers.some((review) => review.userId === userId)) {
        reviewerMap[userId].superchainRubricStepsDelayed += 1;
        reviewerMap[userId].totalReviewsDelayed += 1;
      }

      // Only count final if intake passed
      if (proposal.steps.final && proposal.steps.intake.result !== 'fail' && !proposal.steps.final.rubricAnswers.some((review) => review.userId === userId)) {
        reviewerMap[userId].finalStepsDelayed += 1;
        reviewerMap[userId].totalReviewsDelayed += 1;
      }

      if (reviewedProposal) {
        reviewerMap[userId].proposalsReviewed += 1;
      }
    }
  }

  const keyMap: Record<keyof ReviewerStats, string> = columnOrder.reduce((acc, key) => {
    acc[key] = humanizeKey(key);
    return acc;
  }, {} as Record<keyof ReviewerStats, string>);

  const csvData = Object.values(reviewerMap)
  .sort((a, b) => a.rubricAnswersWithComment - b.rubricAnswersWithComment)
  .map(obj => columnOrder.reduce((acc, key) => {

    acc[keyMap[key]] = obj[key];

    return acc;
  }, {} as Record<string, any>));


  const csvString = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: columnOrder.map(humanizeKey)
  });

  fs.writeFileSync(summaryFile, csvString);
}

exportSummary().then()
