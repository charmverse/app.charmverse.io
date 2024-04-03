import { prisma } from '@charmverse/core/prisma-client';

export async function convertProjectWalletAddresses() {
  const projects = await prisma.project.findMany({
    select: {
      walletAddress: true,
      id: true
    }
  })

  for (const project of projects) {
    await prisma.project.update({
      where: {
        id: project.id
      },
      data: {
        walletAddress: [{
          address: project.walletAddress,
          chain: 1
        }]
      }
    })
  }
}

convertProjectWalletAddresses().then(() => console.log('Done'));
