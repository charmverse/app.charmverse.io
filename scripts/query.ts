import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';

async function query() {
  const result = await prisma.page.findFirst({
    where: {
      id: '74384467-9cad-4540-b9e8-b413fdd793bd'
    }
  });

  console.log(result);
}

query();
