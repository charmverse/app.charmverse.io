import { ethers } from 'ethers';

const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
(async () => {
  const result = await provider.lookupAddress('0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2');
  console.log(result);
})();
