import { getAddress } from 'viem';

import { getPoapsFromAddress } from 'lib/blockchain/poaps';
import { getPublicClient } from 'lib/blockchain/publicClient';
import { getGitcoinPassportScore } from 'lib/credentials/getGitcoinCredentialsByWallets';
import { getUserMemberships } from 'lib/guild-xyz/getUserMemberships';

import { ercAbi, molochDaoAbi } from './abis/abis';
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
    case condition.type === 'ERC721' && !!contractAddress && !!condition.quantity:
    case condition.type === 'ERC20' && !!contractAddress && !!condition.quantity: {
      const minimumQuantity = BigInt(condition.quantity);
      const balance = await publicClient.readContract({
        abi: ercAbi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [userAddress]
      });

      return balance >= minimumQuantity;
    }
    // ERC20 Token
    case condition.type === 'ERC20': {
      const minimumQuantity = BigInt(condition.quantity || 1);
      const balance = await publicClient.getBalance({ address: userAddress });

      return balance >= minimumQuantity;
    }
    // ERC721 With Token Id or ERC1155 With Token Id
    case condition.type === 'ERC1155' && !!contractAddress && !!condition.tokenIds.at(0):
    case condition.type === 'ERC721' && !!contractAddress && !!condition.tokenIds.at(0): {
      const tokenId = BigInt(condition.tokenIds.at(0) || 1);
      const ownerAddress = await publicClient.readContract({
        abi: ercAbi,
        address: contractAddress,
        functionName: 'ownerOf',
        args: [tokenId]
      });

      return userAddress === ownerAddress;
    }
    // Owner of wallet address
    case condition.type === 'Wallet' && !!condition.tokenIds.at(0): {
      return userAddress === condition.tokenIds.at(0);
    }
    // User is member of MolochDAOv2.1
    case condition.type === 'MolochDAOv2.1' && !!contractAddress: {
      const isMemberOfMolochDao = await publicClient.readContract({
        abi: molochDaoAbi,
        address: contractAddress,
        functionName: 'daos',
        args: [userAddress]
      });

      return isMemberOfMolochDao;
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
    case condition.type === 'POAP' && !!condition.tokenIds.at(0): {
      const poaps = await getPoapsFromAddress(userAddress);
      const userHasPoap = poaps.some(
        (poap) =>
          String(poap.event.id) === condition.tokenIds.at(0) || poap.event.name.includes(condition.tokenIds.at(0) || '')
      );

      return userHasPoap;
    }
    // Guild.xyz member
    case condition.type === 'Guildxyz' && !!condition.tokenIds.at(0): {
      const minimumQuantity = Number(condition.quantity || 1);
      const memberships = await getUserMemberships(condition.tokenIds.at(0) || '', userAddress);
      const membershipAccess = memberships.filter((m) => m.access);

      return membershipAccess.length >= minimumQuantity;
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
