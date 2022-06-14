import log from 'lib/log';
import { prisma } from '../db';

(async () => {
  const spaceRoles = await prisma.spaceRole.findMany({
    include: {
      user: true
    }
  });
  log.info('found', spaceRoles.length, 'space roles');
  const toUpdate = spaceRoles
    .filter(spaceRole => spaceRole.user.createdAt < spaceRole.createdAt);
  log.info('updating', toUpdate.length, 'space roles');

  await prisma.$transaction(
    toUpdate
      .map(role => prisma.spaceRole.update({
        where: { id: role.id },
        data: { createdAt: role.user.createdAt }
      }))
  );

})();
