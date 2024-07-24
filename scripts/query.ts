import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {

  const proposals = await Promise.all([
    prisma.proposal.findFirstOrThrow({
      where: {
        page: {
          path: 'form-01-23791989818037274'
        }
      },
      select: {
        form: {
          select: {
            id: true,
            formFields: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    }),
    prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        path: 'form-02-9403447759112731'
      }
    },
    select: {
      form: {
        select: {
          id: true,
          formFields: {
            select: {
              id: true,
            }
          }
        }
      }
    },

  }), prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        path: 'form-03-3875067317580556'
      }
    },
    select: {
      form: {
        select: {
          id: true,
          formFields: {
            select: {
              id: true,
            }
          }
        }
      }
    },
    
  })]);

  prettyPrint({proposals});
}

query();
