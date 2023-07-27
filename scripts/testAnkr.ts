import { getNFTs } from 'lib/blockchain/provider/ankr';

async function init() {
  const nfts = await getNFTs({
    address: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
    chainId: 1,
    walletId: ''
  });
  console.log(nfts);
}
init();
