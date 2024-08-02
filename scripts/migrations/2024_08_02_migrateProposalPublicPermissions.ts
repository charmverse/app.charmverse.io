import { ProposalWorkflowTyped } from "@charmverse/core/proposals";
import { Prisma, prisma } from "@charmverse/core/prisma-client"



const ignoreDomains: string[] = [
  // List maintained in docs
]

async function migrateProposalPublicPermissions() {

  if (!ignoreDomains.length) {
    throw new Error('Please fill the ignoreDomains list with the domains that should not be migrated')
  }

  const proposalsToMigrate = await prisma.proposal.findMany({
    where: {
      space: {
        domain: {
          notIn: ignoreDomains
        }
      },
      evaluations: {
        every: {
          permissions: {
            every: {
              systemRole: {
                not: "public"
              }
            }
          }
        }
      },
      OR: [{
        space: {
          publicProposals: true
        }
      }, {
        page: {
          type: "proposal",
          permissions: {
            some: {
              public: true
            }
          }
        }
      }]
    },
    select: {
      evaluations: {
        select: {
          id: true
        }
      }
    }
  });

  console.log(`Migrating ${proposalsToMigrate.length} proposals`)

  await prisma.proposalEvaluationPermission.createMany({
    data: proposalsToMigrate.flatMap(proposal => proposal.evaluations.map(ev => ({evaluationId: ev.id, operation: 'view', systemRole: 'public'} as Prisma.ProposalEvaluationPermissionCreateManyInput)))
  })

  const workflows = await prisma.proposalWorkflow.findMany({
    where: {
      space: {
        publicProposals: true
      }
    }
  }) as ProposalWorkflowTyped[];

  console.log(`Migrating ${workflows.length} workflows`)

  let current = 0;

  for (const workflow of workflows) {

    console.log(`Migrating workflow ${++current}/${workflows.length}`)

    await prisma.proposalWorkflow.update({
      where: {
        id: workflow.id
      },
      data: {
        evaluations: workflow.evaluations.map(ev => ({...ev, permissions: ev.permissions.some(p => p.systemRole === 'public') ? ev.permissions : [...ev.permissions, {operation: 'view', systemRole: 'public'}]}))
      }
    })
  }

}



async function revert() {
  const data = await prisma.proposalEvaluationPermission.count({
    where: {
      systemRole: 'public'
    }
  })

  console.log('Reverting migration', data)
}
// migrateProposalPublicPermissions()

// revert().then(console.log)