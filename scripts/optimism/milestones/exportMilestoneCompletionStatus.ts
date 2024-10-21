import { ApplicationStatus, ProposalStatus, prisma } from '@charmverse/core/prisma-client';
import { BoardFields, IPropertyTemplate } from '@root/lib/databases/board';
import { prettyPrint } from '@root/lib/utils/strings';

const domain = 'op-grants';

const headers = [
  "Project Name",
  "Time of Proposal Submission",
  "Date",
  "Cycle",
  "Critical Milestones",
  "Completion percentage",
  "Type",
  "Milestone Status",
  "Due Date",
  "Proposal Link",
  "Reviewer",
  "Initial Distribution Date",
  "(OP) Distributed",
  "Total Amount (OP)",
  "Incentive Program Launched?",
  "L2 Address"
] as const;

type HeaderName = typeof headers[number];

// Add in page paths here
const data: string[] = [];

// const milestonePropertyTypeId = '6b4a0ac7-8a69-45e1-b112-a12779483f06';
// const criticalMilestoneValueId = 'ff571db9-e4b8-4a98-8ed8-12a7fdc326e5';

const cleanPaths = data.filter((path) => !!path).map((path) => path.split('/').pop()) as string[];

async function exportMilestoneCompletionStatus() {
  const proposals = await prisma.proposal.findMany({
    where: {
      space: {
        domain: domain
      },
      status: ProposalStatus.published,
      evaluations: {
        every: {
          result: 'pass'
        }
      },
      // page: {
      //   OR: [
      //     {
      //       path: {
      //         in: cleanPaths
      //       }
      //     },
      //     {
      //       additionalPaths: {
      //         hasSome: cleanPaths
      //       }
      //     }
      //   ]
      // }
    },
    select: {
      page: {
        select: {
          path: true,
          additionalPaths: true
        }
      },
      rewards: {
        select: {
          id: true,
          status: true,
          applications: true,
          fields: true
        }
      }
    }
  });

  // prettyPrint(proposals.flatMap((proposal) => proposal.rewards.map((reward) => reward.fields)));

  // process.exit(0);

  let orderedProposalValues: string[] = [];

  for (const proposalPath of data) {
    if (!proposalPath) {
      orderedProposalValues.push('');
      continue;
    }

    const pagePath = proposalPath.split('/').pop();

    if (!pagePath) {
      throw new Error('Invalid page path: ' + pagePath);
    }

    const matchingProposal = proposals.find(
      (proposal) => proposal.page!.path === pagePath || proposal.page!.additionalPaths.includes(pagePath)
    );

    if (!matchingProposal) {
      throw new Error('Could not find proposal for path: ' + pagePath);
    }

    const totalRewards = matchingProposal.rewards.length;

    const completionStatuses: ApplicationStatus[] = ['complete', 'paid', 'processing', 'review'];

    const completedRewards = matchingProposal.rewards.filter((reward) =>
      reward.applications.some((app) => completionStatuses.includes(app.status))
    ).length;

    orderedProposalValues.push(`${completedRewards}/${totalRewards}`);
  }

  console.log('Paths', cleanPaths.length, 'Proposals', proposals.length);

  console.log(orderedProposalValues.join('\n'));
}


async function getSeasonProperty({seasonNumber}: {seasonNumber: number}) {
  const block = await prisma.proposalBlock.findFirstOrThrow({
    where: {
      space: {
        domain
      },
      type: 'board'
    }
  });

  const seasonProperties = ((block.fields as any as BoardFields).cardProperties as any as IPropertyTemplate[]).filter((prop) => prop.name.toLowerCase().match('season'));

  if (seasonProperties.length !== 1) {
    throw new Error(`Invalid season properties. Expected 1, found ${seasonProperties.length}`);
  }

  const seasonProperty = seasonProperties[0];

  console.log('Season Property', seasonProperty);

  const seasonValue = seasonProperty.options.find((opt) => opt.value.toLowerCase().match(`season ${seasonNumber}`));

  if (!seasonValue) {
    throw new Error(`Could not find season ${seasonNumber} in property ${seasonProperty.name} with id ${seasonProperty.id}`);
  }

  return {
    propertyId: seasonProperty.id,
    propertyType: seasonProperty.type,
    propertyName: seasonProperty.name,
    valueId: seasonValue.id,
    valueName: seasonValue.value
  };
}

getSeasonProperty({seasonNumber: 5}).then(prettyPrint)
// exportMilestoneCompletionStatus().then(console.log).catch(console.error);
