import { prisma } from '@charmverse/core/prisma-client';

async function transferVoteDescription() {
  const votes = (await prisma.vote.findMany({})).filter(
    (vote) => vote.description !== null && vote.description.length !== 0
  );

  console.log(`Found ${votes.length} votes with description`);

  for (const vote of votes) {
    await prisma.vote.update({
      data: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: vote.description
                }
              ]
            }
          ]
        },
        description: null,
        contentText: vote.description
      },
      where: {
        id: vote.id
      }
    });

    console.log(`Updated vote ${vote.id}`);
  }

  console.log('Done');
}

transferVoteDescription();
