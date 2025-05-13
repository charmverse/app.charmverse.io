import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import { writeFileSync } from 'fs';

const forumPostersCSV = './game7-forum-posters.csv';
const proposalVotersCSV = './game7-proposal-voters.csv';

async function exportForumPosters(outputPath: string) {
  const posts = await prisma.post.findMany({
    where: {
      space: {
        domain: 'game7'
      }
    },
    include: {
      author: {
        include: {
          wallets: true
        }
      }
    }
  });
  console.log('Found', posts.length, 'forum posts');

  // create a list of authors with theri count of posts
  const counts = posts.reduce(
    (acc, post) => {
      const author = post.author?.username || 'N/A';
      if (!acc[author]) {
        acc[author] = 0;
      }
      acc[author]++;
      return acc;
    },
    {} as Record<string, number>
  );

  const users = posts.map((post) => post.author);

  const csvData = Object.entries(counts).map(([author, count]) => {
    return {
      'Forum Poster': author,
      // 'Forum Poster Email': users.find((user) => user?.username === author)?.email,
      'Forum Poster Wallet': users.find((user) => user?.username === author)?.wallets[0]?.address,
      'Post Count': count
    };
  });

  const csvString = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: ['Forum Poster', 'Forum Poster Wallet', 'Post Count']
  });

  writeFileSync(outputPath, csvString);
}

async function exportProposalVoters(outputPath: string) {
  const votes = await prisma.vote.findMany({
    where: {
      space: {
        domain: 'game7'
      },
      context: 'proposal'
    },
    include: {
      userVotes: {
        include: {
          user: {
            include: {
              wallets: true
            }
          }
        }
      }
    }
  });
  console.log('Found', votes.length, 'proposal votes');

  const userVotes = votes.map((vote) => vote.userVotes).flat();
  const counts = userVotes.reduce(
    (acc, doc) => {
      const author = doc.user?.username || 'N/A';
      if (!acc[author]) {
        acc[author] = 0;
      }
      acc[author]++;
      return acc;
    },
    {} as Record<string, number>
  );
  console.log('user votes', counts);

  const users = userVotes.map((post) => post.user);

  const csvData = Object.entries(counts).map(([author, count]) => {
    return {
      'Proposal Voter': author,
      // 'Forum Poster Email': users.find((user) => user?.username === author)?.email,
      'Forum Poster Wallet': users.find((user) => user?.username === author)?.wallets[0]?.address,
      'Vote Count': count
    };
  });

  const csvString = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: ['Proposal Voter', 'Proposal Voter Wallet', 'Vote Count']
  });

  writeFileSync(outputPath, csvString);
}

exportForumPosters(forumPostersCSV).catch(console.error);
exportProposalVoters(proposalVotersCSV).catch(console.error);
