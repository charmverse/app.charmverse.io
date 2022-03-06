import { prisma } from './db';

(async () => {
  // const users = await prisma.user.findMany({});
  // const map = users.reduce<{ [key: string]: string[] }>((acc, user) => {
  //   user.addresses.forEach(address => {
  //     acc[address] ||= [];
  //     acc[address].push(user.id);
  //   });
  //   return acc;
  // }, {});
  // const dups = Object.keys(map).filter(key => map[key].length > 1);
  // console.log(dups);
  const users = await prisma.user.findMany({
    where: {
      addresses: {
        has: '0x58745fA64DF8052da6678d4e1a11840979F11622'
      }
    },
    include: { pages: true, spaces: true }
  });
  console.log(users);
  process.exit();
})();
