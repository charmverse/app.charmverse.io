import { prisma } from 'db';


export async function updateRecoverCapitalSpace() {
  const defaultSpace = await prisma.space.findMany({
    where: {
      id: {
        in: ['', '']
      }
    }
  })

  if(defaultSpace.length !== 2) {
    console.warn('Did not find any space with this id');
    return;
  }

  const newSpace = await prisma.space.update({
    where: {
      id: ''
    }, data: {
      domain: 'recover-capital2'
    }
  });

  const oldSpace = await prisma.space.update({
    where: {
      id: ''
    }, data: {
      domain: 'recover-capital'
    }
  });

  console.log(`Updated succesfully ${oldSpace.name} space domain into ${oldSpace.domain}`);
}

updateRecoverCapitalSpace()