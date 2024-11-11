// // useProposeSetImplementation.ts
// import type {} from '@safe-global/api-kit';
// import { getSafeApiClient } from '@packages/blockchain/getSafeApiClient';
// import { getScoutProtocolAddress, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
// import SafeApiKit, { ProposeTransactionProps } from '@safe-global/api-kit';
// import { ethers } from 'ethers';
// import { useState, useCallback } from 'react';
// import { encodeFunctionData } from 'viem';
// import { useAccount } from 'wagmi';

// /**
//  * Hook to propose a transaction to call setImplementation on a contract using Gnosis Safe SDK.
//  *
//  * @param safeAddress - The address of the Gnosis Safe.
//  * @param contractAddress - The address of the contract with the setImplementation method.
//  * @returns An object containing the proposeTransaction function, loading state, and any error.
//  */
// const useProposeSetImplementation = (safeAddress: string, contractAddress: string) => {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const { address: account, chain } = useAccount();

//   const proposeTransaction = useCallback(
//     async (newImplementationAddress: string) => {
//       setLoading(true);
//       setError(null);

//       try {
//         if (!signer) {
//           throw new Error('No signer available');
//         }

//         if (!chain) {
//           throw new Error('No network information available');
//         }

//         // Initialize ethers provider and signer
//         const provider = new ethers.providers.Web3Provider((window as any).ethereum);
//         const signerAddress = await signer.getAddress();

//         // Initialize Safe API Kit
//         const safeApiClient = await getSafeApiClient({ chainId: scoutProtocolChainId });

//         // Encode the setImplementation call using viem
//         const data = encodeFunctionData({
//           abi: [
//             {
//               name: 'setImplementation',
//               type: 'function',
//               inputs: [
//                 {
//                   type: 'address',
//                   name: 'newImplementation'
//                 }
//               ]
//             }
//           ],
//           functionName: 'setImplementation',
//           args: [newImplementationAddress]
//         });

//         // Prepare transaction data
//         const safeTx: SafeTransactionData = {};

//         // Create the Safe transaction
//         const safeTransaction = safeApiClient.proposeTransaction({
//           safeTransactionData: {
//             to: getScoutProtocolAddress(),
//             value: '0',
//             data,

//             operation: 0 // 0 for CALL, 1 for DELEGATECALL,
//           }
//         });

//         // Get the transaction hash for signing
//         const txHash = await apiKit.getTransactionHash(safeTransaction);

//         // Sign the transaction hash using the signer
//         const signature = await signer.signMessage(ethers.utils.arrayify(txHash));

//         // Add the signature to the transaction
//         safeTransaction.signatures[safeAddress] = {
//           signer: signerAddress,
//           data: signature
//         };

//         // Propose the transaction via Safe API Kit
//         const response = await apiKit.proposeTransaction(safeTransaction);

//         if (!response.success) {
//           throw new Error(response.message || 'Failed to propose transaction');
//         }

//         console.log('Transaction proposed successfully:', response);
//       } catch (err: any) {
//         console.error('Error proposing transaction:', err);
//         setError(err.message || 'An unknown error occurred');
//       } finally {
//         setLoading(false);
//       }
//     },
//     [signer, chain, safeAddress, contractAddress]
//   );

//   return { proposeTransaction, loading, error };
// };

// /**
//  * Helper function to get the Safe Transaction Service URL based on chain ID.
//  *
//  * @param chainId - The ID of the Ethereum chain.
//  * @returns The URL of the Safe Transaction Service.
//  */
// const getTxServiceUrl = (chainId: number): string => {
//   switch (chainId) {
//     case 1:
//       return 'https://safe-transaction.gnosis.io/';
//     case 5:
//       return 'https://safe-transaction-goerli.safe.global/';
//     case 137:
//       return 'https://safe-transaction-mainnet.safe.global/';
//     // Add other chains as needed
//     default:
//       throw new Error(`Unsupported chain ID: ${chainId}`);
//   }
// };

// export default useProposeSetImplementation;

// // useProposeSetImplementation.ts
// import type {} from '@safe-global/api-kit';
// import { getSafeApiClient } from '@packages/blockchain/getSafeApiClient';
// import { getScoutProtocolAddress, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
// import SafeApiKit, { ProposeTransactionProps } from '@safe-global/api-kit';
// import { ethers } from 'ethers';
// import { useState, useCallback } from 'react';
// import { encodeFunctionData } from 'viem';
// import { useAccount } from 'wagmi';

// /**
//  * Hook to propose a transaction to call setImplementation on a contract using Gnosis Safe SDK.
//  *
//  * @param safeAddress - The address of the Gnosis Safe.
//  * @param contractAddress - The address of the contract with the setImplementation method.
//  * @returns An object containing the proposeTransaction function, loading state, and any error.
//  */
// const useProposeSetImplementation = (safeAddress: string, contractAddress: string) => {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const { address: account, chain } = useAccount();

//   const proposeTransaction = useCallback(
//     async (newImplementationAddress: string) => {
//       setLoading(true);
//       setError(null);

//       try {
//         if (!signer) {
//           throw new Error('No signer available');
//         }

//         if (!chain) {
//           throw new Error('No network information available');
//         }

//         // Initialize ethers provider and signer
//         const provider = new ethers.providers.Web3Provider((window as any).ethereum);
//         const signerAddress = await signer.getAddress();

//         // Initialize Safe API Kit
//         const safeApiClient = await getSafeApiClient({ chainId: scoutProtocolChainId });

//         // Encode the setImplementation call using viem
//         const data = encodeFunctionData({
//           abi: [
//             {
//               name: 'setImplementation',
//               type: 'function',
//               inputs: [
//                 {
//                   type: 'address',
//                   name: 'newImplementation'
//                 }
//               ]
//             }
//           ],
//           functionName: 'setImplementation',
//           args: [newImplementationAddress]
//         });

//         // Prepare transaction data
//         const safeTx: SafeTransactionData = {};

//         // Create the Safe transaction
//         const safeTransaction = safeApiClient.proposeTransaction({
//           safeTransactionData: {
//             to: getScoutProtocolAddress(),
//             value: '0',
//             data,

//             operation: 0 // 0 for CALL, 1 for DELEGATECALL,
//           }
//         });

//         // Get the transaction hash for signing
//         const txHash = await apiKit.getTransactionHash(safeTransaction);

//         // Sign the transaction hash using the signer
//         const signature = await signer.signMessage(ethers.utils.arrayify(txHash));

//         // Add the signature to the transaction
//         safeTransaction.signatures[safeAddress] = {
//           signer: signerAddress,
//           data: signature
//         };

//         // Propose the transaction via Safe API Kit
//         const response = await apiKit.proposeTransaction(safeTransaction);

//         if (!response.success) {
//           throw new Error(response.message || 'Failed to propose transaction');
//         }

//         console.log('Transaction proposed successfully:', response);
//       } catch (err: any) {
//         console.error('Error proposing transaction:', err);
//         setError(err.message || 'An unknown error occurred');
//       } finally {
//         setLoading(false);
//       }
//     },
//     [signer, chain, safeAddress, contractAddress]
//   );

//   return { proposeTransaction, loading, error };
// };

// /**
//  * Helper function to get the Safe Transaction Service URL based on chain ID.
//  *
//  * @param chainId - The ID of the Ethereum chain.
//  * @returns The URL of the Safe Transaction Service.
//  */
// const getTxServiceUrl = (chainId: number): string => {
//   switch (chainId) {
//     case 1:
//       return 'https://safe-transaction.gnosis.io/';
//     case 5:
//       return 'https://safe-transaction-goerli.safe.global/';
//     case 137:
//       return 'https://safe-transaction-mainnet.safe.global/';
//     // Add other chains as needed
//     default:
//       throw new Error(`Unsupported chain ID: ${chainId}`);
//   }
// };

// export default useProposeSetImplementation;
