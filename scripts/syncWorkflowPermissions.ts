import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from 'lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
async function query() {
  // retrieve the workflow
  const workflow = await prisma.proposalWorkflow.findFirst({
    where: {
      space: {
        domain: 'op-grants'
      },
      title: 'S7 TVL Application'
    }
  });

  // console.log(JSON.stringify(workflow, null, 2));

  // retrieve the proposals
  const proposals = await prisma.proposal.findMany({
    where: {
      workflowId: workflow!.id,
      page: {
        deletedAt: null
      }
    },
    orderBy: {
      page: {
        createdAt: 'asc'
      }
    },
    include: {
      evaluations: {
        include: {
          permissions: true
        }
      }
    }
  });
  console.log('Syncing', proposals.length, 'proposals');
  for (const proposal of proposals) {
    console.log(`Syncing ${proposal.id}...`);
    await syncProposalPermissionsWithWorkflowPermissions({
      proposalId: proposal.id
    });
    console.log(`Done!`);
  }
}

query();
