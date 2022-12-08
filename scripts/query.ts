import { prisma } from 'db';

prisma.page.findUnique({
  where: {
    id: '0c4a865a-9b5d-469c-a4ae-a2b34fd62d7e'
  }
}).then(record => {
  // eslint-disable-next-line no-console
  console.log( JSON.stringify(record?.content));
});
