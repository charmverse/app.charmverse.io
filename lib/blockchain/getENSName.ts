import { ethers } from 'ethers';

const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

export default function getENSName (address: string) {
  return provider.lookupAddress(address);
}
