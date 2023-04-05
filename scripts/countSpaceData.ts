import { countData } from 'lib/spaces/countData';
import { prisma } from 'db';
import { writeFileSync} from 'fs';

const filename = 'space-data.csv';

async function init () {

  let csv = 'Space, Bounties, Proposal Categories, Proposals, Pages, Page Content, Boards, Board Description Content, Views, Cards, Forum Categories, Forum Posts, Forum Post Content, Comments, Member Properties, Total\n';

  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  for (let space of spaces) {
    console.log('\nSpace: ', space.name);
    const data = await countData({ spaceId: space.id });
    console.log(data);
    // write to CSV file
    const columns = [space.name.replace(/,/g, '_'), data.counts.bounties, data.counts.proposalCategories, data.counts.proposals, data.counts.pages, data.counts.documentBlocks, data.counts.boards, data.counts.boardDescriptionBlocks, data.counts.views, data.counts.cards, data.counts.forumCategories, data.counts.forumPosts, data.counts.forumPostBlocks, data.counts.comments, data.counts.memberProperties, data.total];
    csv += columns.join(',')+ '\n';
  }
  writeFileSync(`${process.cwd()}/${filename}`, csv );
}

init().then(() => {
  console.log('done')
});
