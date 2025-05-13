import * as _ from 'lodash';

import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import { writeFileSync } from 'fs';

const FILE_OUTPUT_PATH = './dev-candidates.csv';

const targetDomains: string[] = [
  // Add domains here
];

async function generateCSV() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          verifiedEmails: {
            some: {}
          }
        },
        {
          googleAccounts: {
            some: {}
          }
        }
      ],
      pages: {
        some: {
          type: 'proposal',
          space: {
            domain: {
              in: targetDomains
            }
          },
          proposal: {
            status: 'published',
            evaluations: {
              some: {
                result: 'pass'
              }
            }
          }
        }
      },
      AND: [
        {
          spaceRoles: {
            none: {
              space: {
                domain: 'charmverse'
              }
            }
          }
        },
        {
          spaceRoles: {
            none: {
              space: {
                domain: {
                  startsWith: 'cvt-'
                }
              }
            }
          }
        },
        {
          spaceRoles: {
            some: {
              space: {
                domain: {
                  in: targetDomains
                }
              }
            }
          }
        }
      ]
    },
    include: {
      verifiedEmails: true,
      googleAccounts: true
    },
    take: 150
  });

  console.log('Found', users.length, 'users');

  // process.ex

  let allUsersData = [];

  for (const user of users) {
    const email = user.verifiedEmails?.[0]?.email ?? user.googleAccounts?.[0]?.email;

    const emailName = user.verifiedEmails?.find((verified) => !verified.name.match('@'));
    const googleName = user.googleAccounts?.find((google) => !google.name.match('@'));

    const name = emailName?.name || googleName?.name;

    const fName = name?.trim().split(' ')[0];

    // console.table(proposalData);
    allUsersData.push({
      name: fName ?? '',
      email: email
    });
  }

  const columns = _.uniq(allUsersData.flatMap((user) => Object.keys(user)));
  const csvString = stringify(allUsersData, { header: true, columns });

  writeFileSync(FILE_OUTPUT_PATH, csvString);
}

generateCSV().then(() => console.log('Done'));
