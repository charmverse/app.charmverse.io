import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import { writeFileSync } from 'fs';

const spaceDomain = 'moxie-grants';

async function exportFullReviewSummary() {
  const proposals = await prisma.page.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      proposal: {
        status: 'draft'
      }
    },
    include: {
      author: {
        include: {
          farcasterUser: true
        }
      }
    }
  });
  const csvData: {
    Title: string;
    Author: string;
    Link: string;
    'Author Email': string;
    'Last Updated': string;
  }[] = proposals.map(({ author, updatedAt, path, title }) => {
    return {
      Title: title,
      Author: author.username,
      'Author Email': author.email || '',
      'Author Farcaster': author.farcasterUser?.fid,
      Link: 'https://app.charmverse.io/' + spaceDomain + '/' + path,
      'Last Updated': updatedAt.toLocaleDateString('en-US')
    };
  });

  const csvString = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: ['Title', 'Author', 'Author Farcaster', 'Author Email', 'Link', 'Last Updated']
  });

  writeFileSync('./moxie-export.tsv', csvString);
}

exportFullReviewSummary().catch(console.error);
