import { getGitcoinPassportScore } from '@packages/credentials/getGitcoinCredentialsByWallets';
import { getPoapsFromAddress } from '@packages/lib/blockchain/poaps';
import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { getUserMemberships } from '@packages/lib/guild-xyz/getUserMemberships';
import { formatUnits, getAddress, parseEther, parseAbi } from 'viem';

import { erc1155Abi, ercAbi, hatsProtocolAbi, molochDaoAbi } from './abis/abis';
import { subscriptionTokenV1ABI } from './hypersub/abi';
import type { AccessControlCondition } from './interfaces';
import { PublicLockV13 } from './unlock/abi';

export async function validateTokenGateCondition(
  condition: AccessControlCondition,
  walletAddress: string
): Promise<boolean> {
  const userAddress = getAddress(walletAddress);
  const contractAddress = condition.contractAddress ? getAddress(condition.contractAddress) : ('' as `0x${string}`);
  const publicClient = getPublicClient(Number(condition.chain));

  switch (true) {
    // ERC721 Collection or ERC20 Custom Token quantity
    case condition.type === 'Builder' && !!contractAddress && !!condition.quantity:
    case condition.type === 'ERC721' && !!contractAddress && !!condition.quantity: {
      const minimumQuantity = BigInt(condition.quantity);
      const balance = await publicClient.readContract({
        abi: ercAbi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [userAddress]
      });

      return balance >= minimumQuantity;
    }
    case condition.type === 'ERC20' && !!contractAddress && !!condition.quantity: {
      const minimumQuantity = BigInt(condition.quantity);
      const balance = await publicClient.readContract({
        abi: ercAbi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [userAddress]
      });
      const decimals = await publicClient.readContract({
        abi: ercAbi,
        address: contractAddress,
        functionName: 'decimals'
      });

      if (decimals !== 18) {
        const regularUnits = formatUnits(balance, decimals);
        const weiBalance = parseEther(regularUnits);
        return weiBalance >= minimumQuantity;
      }

      return balance >= minimumQuantity;
    }
    // Hats Protocol
    case condition.type === 'Hats' && contractAddress && !!condition.tokenIds[0]: {
      const tokenId = BigInt(condition.tokenIds[0] || 1);
      const balance = await publicClient.readContract({
        abi: hatsProtocolAbi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [userAddress, tokenId]
      });

      return balance >= 1;
    }
    // ERC20 Token
    case condition.type === 'ERC20': {
      const minimumQuantity = BigInt(condition.quantity || 1);
      const balance = await publicClient.getBalance({ address: userAddress });

      return balance >= minimumQuantity;
    }
    // ERC1155 With Token Id
    case condition.type === 'ERC1155' && !!contractAddress && !!condition.tokenIds[0]: {
      const tokenId = BigInt(condition.tokenIds[0] || 1);

      const ownedNumberOfNFTs = await publicClient.readContract({
        abi: erc1155Abi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [userAddress, tokenId]
      });

      return ownedNumberOfNFTs > 0;
    }
    case condition.type === 'ERC721' && !!contractAddress && !!condition.tokenIds[0]: {
      const tokenId = BigInt(condition.tokenIds[0] || 1);
      const ownerAddress = await publicClient.readContract({
        abi: ercAbi,
        address: contractAddress,
        functionName: 'ownerOf',
        args: [tokenId]
      });

      return userAddress === ownerAddress;
    }
    case condition.type === 'ContractMethod': {
      const minimumQuantity = BigInt(condition.quantity || 1);
      const result = await publicClient.readContract({
        abi: parseAbi([`function ${condition.method}(address) view returns (uint256)`]),
        address: contractAddress,
        functionName: condition.method,
        args: [walletAddress as `0x${string}`]
      });
      // we support structs, so long as the amount is first value in the struct. further support would require more user input
      const balance = Array.isArray(result) ? result[0] : result;

      return balance >= minimumQuantity;
    }
    // Owner of wallet address
    case condition.type === 'Wallet' && !!condition.tokenIds[0]: {
      return userAddress === condition.tokenIds[0];
    }
    // User is member of MolochDAOv2.1
    case condition.type === 'MolochDAOv2.1' && !!contractAddress: {
      const memberOfMolochDaoInfo = await publicClient.readContract({
        abi: molochDaoAbi,
        address: contractAddress,
        functionName: 'members',
        args: [userAddress]
      });

      // Each position in the array is an attribute of the member.
      return !!memberOfMolochDaoInfo?.at(3);
    }
    // Unlock Protocol member
    case condition.type === 'Unlock' && !!contractAddress: {
      const hasValidKey = await publicClient.readContract({
        address: contractAddress,
        abi: PublicLockV13,
        functionName: 'getHasValidKey',
        args: [userAddress]
      });

      return hasValidKey;
    }
    // Hypersub member
    case condition.type === 'Hypersub' && !!contractAddress: {
      const minimumQuantity = BigInt(condition.quantity || 1);
      const balance = await publicClient.readContract({
        address: contractAddress,
        abi: subscriptionTokenV1ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      });

      return balance >= minimumQuantity;
    }
    // POAP event id or event name
    case condition.type === 'POAP' && !!condition.tokenIds[0]: {
      const poaps = await getPoapsFromAddress(userAddress);
      const userHasPoap = poaps.some(
        (poap) => String(poap.event.id) === condition.tokenIds[0] || poap.event.name.includes(condition.tokenIds[0])
      );

      return userHasPoap;
    }
    // Guild.xyz member
    case condition.type === 'Guildxyz' && !!condition.tokenIds[0]: {
      const hasMembership = await getUserMemberships(condition.tokenIds[0], userAddress);
      return hasMembership;
    }
    // Gitcoin Passport
    case condition.type === 'GitcoinPassport': {
      const minimumQuantity = Number(condition.quantity || 1);
      const scoreItems = await getGitcoinPassportScore(userAddress);
      const score = Number(scoreItems?.score || 0);

      return score > minimumQuantity;
    }

    default: {
      return false;
    }
  }
}
