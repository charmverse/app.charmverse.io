import { RPCList } from 'connectors';
import { prisma } from 'db';

function assignChainIds (): Promise<any> {

  return Promise.all(
    RPCList.map(chain => {
      const nativeCurrency = chain.nativeCurrency.symbol;
      const chainId = chain.chainId;
      console.log(chainId, nativeCurrency);
      if (chainId && nativeCurrency) {
        console.log('Moving inside');
        return prisma.bounty.updateMany({
          where: {
            rewardToken: nativeCurrency
          },
          data: {
            chainId
          }
        });
      }
      return Promise.resolve(false);
    })
  );
}

assignChainIds()
  .then(() => {
    console.log('Success!');
  });
