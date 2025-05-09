import { ApplicationStatus, prisma } from '@charmverse/core/prisma-client';

const domain = 'op-grants';

// Add in page paths here
const data: string[] = [];

const milestonePropertyTypeId = '6b4a0ac7-8a69-45e1-b112-a12779483f06';
const criticalMilestoneValueId = 'ff571db9-e4b8-4a98-8ed8-12a7fdc326e5';

const cleanPaths = data.filter((path) => !!path).map((path) => path.split('/').pop()) as string[];

async function exportMilestoneCompletionStatus() {
  const proposals = await prisma.proposal.findMany({
    where: {
      space: {
        domain: domain
      },
      page: {
        OR: [
          {
            path: {
              in: cleanPaths
            }
          },
          {
            additionalPaths: {
              hasSome: cleanPaths
            }
          }
        ]
      }
    },
    select: {
      page: {
        select: {
          path: true,
          additionalPaths: true
        }
      },
      rewards: {
        where: {
          fields: {
            path: ['properties', milestonePropertyTypeId],
            equals: criticalMilestoneValueId
          }
        },
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

// exportMilestoneCompletionStatus().then(console.log).catch(console.error);
