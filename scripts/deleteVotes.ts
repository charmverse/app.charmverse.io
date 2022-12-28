import { prisma } from 'db'

async function deleteInlineVotes () {
  const posts = await prisma.vote.findMany({
    where: {
      context: "inline",
    },
    select: {
      pageId: true
    }
  })

  console.log(new Set(posts.map(post => post.pageId)).size)
}

deleteInlineVotes();