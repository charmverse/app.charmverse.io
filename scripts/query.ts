import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utilities/strings';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.proposal.findMany({
    where: {
      selectedCredentialTemplates: {
        isEmpty: false
      }
    },
    select: {
      status: true,
      selectedCredentialTemplates: true,
      space: {
        select: {
          domain: true,
          credentialTemplates: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      authors: {
        select: {
          author: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }
    }
  })

  prettyPrint(acc); 
}

search().then(() => console.log('Done'));
