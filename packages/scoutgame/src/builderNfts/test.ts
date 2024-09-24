// import { getWalletClient } from '@root/lib/blockchain/walletClient';
// import { v4 as uuid } from 'uuid';

// import { builderNftChain, builderSmartContractOwnerKey, builderContractAddress } from './constants';
// import { ContractApiClient } from './nftContractApiClient';

// const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

// const apiClient = new ContractApiClient({
//   chain: builderNftChain,
//   contractAddress: builderContractAddress,
//   walletClient: serverClient
// });

// // apiClient.getTokenPurchasePrice({ args: { tokenId: BigInt(4), amount: BigInt(1) } }).then(console.log);

// apiClient.getBuilderIdForToken({ args: { tokenId: BigInt(4) } }).then(console.log);

// apiClient
//   .buyToken({
//     args: {
//       tokenId: BigInt(1),
//       amount: BigInt(1),
//       scout: uuid()
//     },
//     value: BigInt(20000000000000)
//   })
//   .then(console.log);
