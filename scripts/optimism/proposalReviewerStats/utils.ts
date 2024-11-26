import { log } from "@charmverse/core/log";
import { prisma } from "@charmverse/core/prisma-client";
import { BoardView } from "@root/lib/databases/boardView";
import { CardFilter } from "@root/lib/databases/cardFilter";
import { getDatabaseWithSchema } from "@root/lib/public-api/getDatabaseWithSchema";
import { prettyPrint } from "@root/lib/utils/strings";
import type { PageWithReviewer } from './stubs';
import { pagesWithReviewer } from "./stubs";
import { matchesProperty } from "lodash";
const domain = 'op-grants';

function getProposals({paths, spaceId, userId}: {paths: string[]; spaceId: string; userId: string}) {
  return prisma.proposal.findMany({
    where: {
      spaceId,
      page: {
        path: {
          in: paths
        }
      }
    },
    select:  {
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
            rubricAnswers: {
              where: {
                userId: userId
              }
            },
            reviews: {
              where: {
                reviewerId: userId
              },
              include: {
                reviewer: {
                  select: {
                    id: true,
                    username: true,
                  }
                }
              }
            }
          }
        }
      } 
  })
};

type ProposalWithInfo = Awaited<ReturnType<typeof getProposals>>[number];

type AssignedProposal = {
  userId: string;
  proposalId: string;
  foundIntakeStep: boolean;
  foundPrelimStep: boolean;
  foundFinalStep: boolean;
  assignedToIntake: boolean;
  assignedToPrelim: boolean;
  assignedToFinal: boolean;
  proposal: ProposalWithInfo;
}



export async function getAssignedProposalsInSpace({userPage, spaceId}: {userPage: PageWithReviewer; spaceId: string}): Promise<AssignedProposal[]> {

  const assignedProposals: Record<string, AssignedProposal> = {};

  for (let i = 0; i < userPage.pagesWithView.length; i++) {
    const view = userPage.pagesWithView[i];

    log.info(`\r\n---- Processing view ${i + 1} of ${userPage.pagesWithView.length}`);

    const [block, page] = await Promise.all([prisma.block.findUniqueOrThrow({
      where: {
        id: view.viewId
      },
      select: {
        id: true,
        fields: true
      }
    }),
    prisma.page.findFirstOrThrow({
      where: {
        path: view.pagePath,
        spaceId
      }
    })
    ]);

    const dbView = block as BoardView;

    const linkedSourceId = dbView.fields.linkedSourceId as string;

    if (!linkedSourceId) {
      throw new Error('Expected linked source id');
    }

    const dbSchema = await getDatabaseWithSchema({databaseId: linkedSourceId, spaceId});


    const intakeStep = dbSchema.schema.find(field => field.name.toLowerCase() === 'intake');
    const prelimStep = dbSchema.schema.find(field => field.name.toLowerCase() === 'prelim');
    const finalStep = dbSchema.schema.find(field => field.name.toLowerCase() === 'final');

    const proposalUrlField = dbSchema.schema.find(field => field.type === 'proposalUrl');

    if (!proposalUrlField) {
      throw new Error('Expected proposalUrl field');
    }

    const cards = await prisma.block.findMany({
      where: {
        type: 'card',
        rootId: linkedSourceId
      }
    });

    const filterdCards = await CardFilter.applyFilterGroup(dbView.fields.filter, dbSchema.schema as any, cards as any);

    const paths = filterdCards.map(card => card.fields.properties[proposalUrlField.id] as string).filter(Boolean);

    const proposalsList = await getProposals({paths, spaceId, userId: userPage.user.id});

    for (let i = 0; i < filterdCards.length; i++) {
      const card = filterdCards[i];

      log.info(`Processing card ${i + 1} of ${filterdCards.length}`);

      const proposalUrl = card.fields.properties[proposalUrlField.id] as string;

      const matchingProposal = proposalUrl ? proposalsList.find(proposal => proposal.page?.path === proposalUrl) : null;

      if (!matchingProposal) {
        log.warn(`No proposal found for ${proposalUrl}`);
        continue;
      }

      const isAssignedToIntake = intakeStep && (card.fields.properties[intakeStep.id] as string[])?.includes(userPage.user.id);
      const isAssignedToPrelim = prelimStep && (card.fields.properties[prelimStep.id] as string[])?.includes(userPage.user.id);
      const isAssignedToFinal = finalStep && (card.fields.properties[finalStep.id] as string[])?.includes(userPage.user.id);


      const assignedProposal: AssignedProposal = {
        userId: userPage.user.id,
        proposalId: proposalUrl,
        foundIntakeStep: !!intakeStep,
        foundPrelimStep: !!prelimStep,
        foundFinalStep: !!finalStep,
        assignedToIntake: !!isAssignedToIntake,
        assignedToPrelim: !!isAssignedToPrelim,
        assignedToFinal: !!isAssignedToFinal,
        proposal: matchingProposal
      }

      const existing = assignedProposals[matchingProposal.id];

      if (!existing) {
        assignedProposals[matchingProposal.id] = assignedProposal;
      // Selectively overwrite the data
      } else {
        if (!existing.foundIntakeStep && assignedProposal.foundIntakeStep) {
          existing.foundIntakeStep = assignedProposal.foundIntakeStep;
        }
        if (!existing.foundPrelimStep && assignedProposal.foundPrelimStep) {
          existing.foundPrelimStep = assignedProposal.foundPrelimStep;
        }
        if (!existing.foundFinalStep && assignedProposal.foundFinalStep) {
          existing.foundFinalStep = assignedProposal.foundFinalStep;
        }
      }
    }
  }

  return Object.values(assignedProposals);
}


async function script() {


  const {id: spaceId} = await prisma.space.findUniqueOrThrow({
    where: {
      domain
    },
    select: {
      id: true
    }
  });

  const start = 0;

  const total = 1;
  // const total = pagesWithReviewer.length;

  for (let i = start; i < total; i++) {
    log.info(`Processing page ${i + 1} of ${total}`);
    log.info(`${pagesWithReviewer[i].title}`);
    log.info(`User: ${pagesWithReviewer[i].user.username}`);
    const page = pagesWithReviewer[i];
    try {
      await getAssignedProposalsInSpace({userPage: page, spaceId});
    } catch (error) {
      log.error(`Error processing page ${page.title}: ${error}`);
    }
  }
}
// script().then(prettyPrint);
