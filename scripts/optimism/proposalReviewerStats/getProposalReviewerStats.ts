import { User, UserSpaceAction, prisma } from '@charmverse/core/prisma-client';
import { getUniqueWeeksCount } from '@packages/utils/dates';
import { humanizeKey } from '@packages/utils/strings';
import fs from 'node:fs';
import { pagesWithReviewer } from './stubs';
import { getAssignedProposalsInSpace } from './utils';

import { stringify } from 'csv-stringify/sync';
import { log } from '@charmverse/core/log';

const spaceDomain = 'op-grants';
const summaryFile = './op-reviewer-stats.csv';


const steps = [
  'intake',
  'superchainRubric', // Intake OR Superchain Rubric
  'final' // Final OR Superchain Grant Approval
] as const;

type StepType = (typeof steps)[number];


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

  const rows: any[] = [];


  const reviewerMap: Record<string, ReviewerStats> = {};


  const userProfiles: Record<string, Pick<User, 'id' | 'username'> & {spaceActions: Pick<UserSpaceAction, 'createdAt'>[]}> = {};

  for (const userPage of pagesWithReviewer) {

    const userId = userPage.user.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: userId
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
            action: 'app_loaded',
            spaceId,
          }
        }
      }
    });

    userProfiles[userId] = user;

    const proposals = await getAssignedProposalsInSpace({userPage, spaceId});


    console.log('Total proposals:', proposals.length);

    reviewerMap[userId] = {
      userId,
      username: user.username,
      appLoadedTimes: user.spaceActions.length,
      uniqueWeeksAppVisited: getUniqueWeeksCount(user.spaceActions.map((action) => action.createdAt)),
      proposalsReviewed: proposals.length,
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



  for (let i = 0; i < proposals.length; i++) {
    const proposalInfo = proposals[i];

    log.info(`Processing proposal ${i + 1} of ${proposals.length}`, {proposalInfo});

    const proposal = proposalInfo.proposal;

    const intakeStep = proposal.evaluations.find((evaluation) => evaluation.title.toLowerCase().match('intake'));

        // Intake stats --------------------------
    if (intakeStep) {
      if (proposalInfo.assignedToIntake) {
        const userIntakeReview = intakeStep.reviews.find((review) => review.reviewer.id === userId);

        if (userIntakeReview && userIntakeReview.result === 'fail') {
          reviewerMap[userId].declinedOnIntake += 1;
        }

        if (userIntakeReview && userIntakeReview.declineMessage) {
          reviewerMap[userId].commentedWhenDeclinedOnIntake += 1;
        }

        if (!userIntakeReview) {
          reviewerMap[userId].intakeStepsDelayed += 1;
          reviewerMap[userId].totalReviewsDelayed += 1;
        }
      }
    }

    const prelimStep = proposal.evaluations.find((evaluation) => evaluation.title.toLowerCase().match('(prelim|superchain rubric)') && !evaluation.title.toLowerCase().match('final') );

    if (prelimStep) {

      if (proposalInfo.assignedToPrelim) {

        const userPrelimRubricAnswers = prelimStep.rubricAnswers.filter((rubricAnswer) => rubricAnswer.userId === userId);

        reviewerMap[userId].rubricAnswers += userPrelimRubricAnswers.length;
        reviewerMap[userId].rubricAnswersWithComment += userPrelimRubricAnswers.filter((answer) => !!answer.comment?.length && answer.comment.length > 2).length;

        if (!userPrelimRubricAnswers.length) {
          reviewerMap[userId].superchainRubricStepsDelayed += 1;
          reviewerMap[userId].totalReviewsDelayed += 1;
        }
      }
    }

    const finalStep = proposal.evaluations.find((evaluation) => evaluation.title.toLowerCase().match('final'));

    if (finalStep) {
      if (proposalInfo.assignedToFinal) {

        const userFinalRubricAnswers = finalStep.rubricAnswers.filter((rubricAnswer) => rubricAnswer.userId === userId);

        reviewerMap[userId].rubricAnswers += userFinalRubricAnswers.length;
        reviewerMap[userId].rubricAnswersWithComment += userFinalRubricAnswers.filter((answer) => !!answer.comment?.length && answer.comment.length > 2).length;

        if (!userFinalRubricAnswers.length) {
          reviewerMap[userId].finalStepsDelayed += 1;
          reviewerMap[userId].totalReviewsDelayed += 1;
        }
      }
     }

      // Rubric stats --------------------------
      const allUserRubricAnswers = [...(prelimStep?.rubricAnswers || []), ...(finalStep?.rubricAnswers || [])].filter(a => a.userId === userId);

      reviewerMap[userId].rubricAnswers += allUserRubricAnswers.length;
      reviewerMap[userId].rubricAnswersWithComment += allUserRubricAnswers.filter((answer) => !!answer.comment?.length).length;

      // Page Comment stats --------------------------
      const userProposalComments = proposal.page!.comments.filter((comment) => comment.createdBy === userId).length;

      if (userProposalComments) {
        reviewerMap[userId].uniqueProposalPagesCommented+= 1;
        reviewerMap[userId].totalProposalPageComments += userProposalComments;
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


// getAssignedReviewers().then();