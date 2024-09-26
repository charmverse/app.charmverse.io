import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';

async function query() {
  console.log('Starting proposal evaluation renaming...');

  const w = await prisma.proposalWorkflow.updateMany({
    where: {
      spaceId: '47763a6c-4012-4052-aa0d-7c563b16e662'
    },
    data: {
      privateEvaluations: false
    }
  });

  console.log(w);
}

query();
