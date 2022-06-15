import { prisma } from 'db';
import { setupDefaultPaymentMethods } from 'lib/payment-methods/defaultPaymentMethods';

const concurrentSpacesProcessed = 5;

// Provide default USDC payment methods for all spaces
async function addPaymentMethods (): Promise<number> {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true
    }
  });

  for (let i = 0; i < spaces.length; i += concurrentSpacesProcessed) {

    const spacesToProcess = spaces.slice(i, i + concurrentSpacesProcessed);

    await Promise.all(spacesToProcess.map(space => {
      return setupDefaultPaymentMethods({ spaceIdOrSpace: space });
    }));
  }

  return spaces.length;
}

addPaymentMethods()
  .then((spacesProcessed) => {
    // console.log('Added payment methods for ', spacesProcessed, ' spaces');
  });
