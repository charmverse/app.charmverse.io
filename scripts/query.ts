import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';

import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
/**

  userId: cb9a5ede-6ff7-4eaa-9c23-91e684e23aed
  spaceId: 33918abc-f753-4a3d-858d-63c3fa36fa15

  kameil userId: f7d47848-f993-4d16-8008-e1f5b23b8ad3 or 356af4f7-cbd1-4350-b046-9f55da500fec
*/

/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.proposalEvaluationPermission.findMany({
    where: {
      roleId: null,
      systemRole: null,
      userId: null
    },
    include: {
      evaluation: {
        select: {
          title: true,
          proposal: {
            select: {
              page: {
                select: {
                  createdAt: true
                }
              },
              space: {
                select: {
                  name: true,
                  domain: true
                }
              },
              workflow: true
            }
          }
        }
      }
    }
  });
  let workflowIds = new Set();
  let canFix = 0;
  let cantFix = 0;
  for (const permission of acc) {
    const evaluationConfig = permission.evaluation.proposal.workflow?.evaluations.find(
      (evaluation) => (evaluation as any)!.title === permission.evaluation.title
    ) as WorkflowEvaluationJson | undefined;
    if (evaluationConfig) {
      const rolePermission = evaluationConfig.permissions.find(
        (perm) => perm.operation === permission.operation && perm.roleId
      );
      if (rolePermission) {
        // await prisma.proposalEvaluationPermission.update({
        //   where: {
        //     id: permission.id
        //   },
        //   data: {
        //     roleId: rolePermission.roleId
        //   }
        // });
        canFix++;
        continue;
      }
    }
    cantFix++;
  }
  console.log(
    'No workflow',
    acc.filter((a) => !a.evaluation.proposal.workflow).map((a) => a.evaluation.proposal)
  );
  console.log({ canFix, cantFix });
  // console.log(acc.filter((a) => !a.evaluation.proposal.workflowId).length);
  // console.log(workflowIds);
  // const workflows = await prisma.proposalWorkflow.findMany({
  //   where: {
  //     id: {
  //       in: [...workflowIds].filter(Boolean)
  //     }
  //   }
  // });
  // console.log(
  //   JSON.stringify(
  //     workflows.map((w) => w.evaluations.map((e) => e!.permissions)),
  //     null,
  //     2
  //   )
  // );
  //console.log(JSON.stringify(acc.slice(0, 10), null, 2));
}

search().then(() => console.log('Done'));
