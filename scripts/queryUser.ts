import { prisma } from '../db';

(async () => {
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: '0x542422766519CE9cb6D6206b5013FD21b38F02e4'
      }
    }
  });
  console.log(user);
  process.exit();
})();
