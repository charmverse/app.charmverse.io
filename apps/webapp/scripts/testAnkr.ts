import { getNFT } from 'lib/blockchain/provider/ankr/client';

async function init() {
  const nfts = await getNFT({
    address: '0x22fa785f3bd88b54ac076ad253b1b68332c27d58',
    chainId: 5000,
    tokenId: '1'
  });
  console.log(nfts);
}
init();
