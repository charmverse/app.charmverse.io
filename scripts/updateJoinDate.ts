import { prisma } from '../db';

(async () => {
  const spaceRoles = await prisma.spaceRole.findMany({
    include: {
      user: true
    }
  });
  console.log('found', spaceRoles.length, 'space roles');
  const toUpdate = spaceRoles
    .filter(spaceRole => spaceRole.user.createdAt < spaceRole.joinDate);
  console.log('updating', toUpdate.length, 'space roles');

  await prisma.$transaction(
    toUpdate
      .map(role => prisma.spaceRole.update({
        where: { id: role.id },
        data: { joinDate: role.user.createdAt }
      }))
  );

})();
