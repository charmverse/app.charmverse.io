import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';

async function query() {
  const result = await prisma.page.count({
    where: {
      parent: {
        path: 'tech-task-list-49366552253645923'
      }
    }
  });
  console.log(result);
}

query();
