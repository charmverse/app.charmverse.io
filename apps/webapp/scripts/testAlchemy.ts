import { getTokenMetadata } from 'lib/tokens/getTokenMetadata';

async function init() {
  // getTokenMetaData relies on Alchemy API
  const metadata = await getTokenMetadata({
    // custom ERC20 token
    contractAddress: '0x1b171f1a3970ba1378a0da615a07df68b979053e',
    chainId: 11155420 // OP Sepolia
  });
  console.log(metadata);
}
init().catch((e) => console.error(e));
