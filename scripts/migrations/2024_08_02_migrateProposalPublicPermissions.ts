import { Prisma, prisma } from "@charmverse/core/prisma-client"



const ignoreDomains: string[] = [
  // List maintained in docs
]

async function migrateProposalPublicPermissions() {
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
}

// migrateProposalPublicPermissions()