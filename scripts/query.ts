import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const bountyCards = await prisma.proposal.findFirst({
    where: {
      page: {
        path: 'xandra-4799432385546818'
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

  console.log(
    bountyCards?.evaluations.map(
      (e) => e.title + e.permissions.filter((p) => p.operation === 'view').map((p) => p.systemRole)
    )
  );
}

search().then(() => console.log('Done'));
