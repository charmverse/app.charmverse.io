
import { prisma } from '../db';

(async () => {

  const gates = await prisma.tokenGate.findMany({
    include: {
      space: true
    }
  });
  // console.log('gates', gates.length);
  // console.log('gates without chain', gates.filter(g => !(g.conditions as any).chain));

})();
