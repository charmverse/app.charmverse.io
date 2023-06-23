import { prisma } from '@charmverse/core/prisma-client';

// a function that adds OP token as a default payment for all spaces in the database
async function init() {

  const votes = await prisma.vote.findMany({})

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
                  content: vote.description
                }
              ]
            }
          ]
        },
        contentText: vote.description
      },
      where: {
        id: vote.id
      }
    })
  }
}

init();
