import * as _ from 'lodash';

import { writeFileSync } from 'fs';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';

const FILE_OUTPUT_PATH = './cit-web3-rewards.csv';

const columns = ['User name', 'Application Status', 'Reward Title', 'Start Date'];

type CSVRow = {
  'User name': string;
  'Application Status': string;
  'Reward Title': string;
  'Start Date': string;
};

async function generateCSV() {
  const applications = await prisma.application.findMany({
    where: {
      bounty: {
        space: {
          domain: 'cit-web3'
        }
      }
    },
    include: {
      applicant: true,
      bounty: {
        select: {
          page: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  console.log('Found', applications.length, 'applications');

  let rows: CSVRow[] = [];

  for (const application of applications) {
    rows.push({
      'User name': application.applicant.username,
      'Reward Title': application.bounty.page!.title,
      'Application Status': application.status,
      'Start Date': application.createdAt.toDateString()
    });
  }

  const csvString = stringify(rows, { header: true, columns, delimiter: '\t' });

  writeFileSync(FILE_OUTPUT_PATH, csvString);
  console.log('CSV file written to', FILE_OUTPUT_PATH);
}

generateCSV().then(() => console.log('Done'));
