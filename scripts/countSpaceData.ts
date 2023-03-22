import { countData } from 'lib/spaces/countData';
import { prisma } from 'db';
import { writeFileSync} from 'fs';

const filename = 'space-data.csv';

async function init () {

  let csv = 'Space, Bounties, Proposals, Pages, Views, Boards, Posts, Templates, Document Blocks, Total\n';

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
    const columns = [space.name, data.counts.bounties, data.counts.proposals, data.counts.pages, data.counts.views, data.counts.boards, data.counts.posts, data.counts.templates, data.counts.documentBlocks, data.total];
    csv += columns.join(',')+ '\n';
  }
  writeFileSync(`${process.cwd()}/${filename}`, csv );
}

init().then(() => {
  console.log('done')
});
