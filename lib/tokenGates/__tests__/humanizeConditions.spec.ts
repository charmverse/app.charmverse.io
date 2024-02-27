import {
  ownedEVMTokenCondition,
  ownedTokenSupportedBlockchain,
  ownsWalletCondition,
  ownedEth,
  ownedCustomToken,
  ownsSpecificPoap,
  ownsAnyPoap,
  daoMember,
  nftCollectionOwner,
  specificNftOwner,
  multipleErc,
  unlockProtocolCondition,
  hypersubCondition,
  guildCondition,
  gitcoinCondition
} from 'stories/lib/mockTokenGataData';

import { humanizeConditions, humanizeConditionsData } from '../humanizeConditions';
import type { TokenGateConditions } from '../interfaces';

describe('humanizeConditions', () => {
  it('should return an owned wallet address condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownsWalletCondition
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Controls wallet with address 0x1bd0…07f4');
  });

  it('should return owned eth on a specific L2 blockchain condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownedEVMTokenCondition
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 ETH on Optimism');
  });

  it('should return owned token on a supported blockchain condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownedTokenSupportedBlockchain
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 12 BNB on Binance Smart Chain');
  });

  it('should return owned eth on ethereum condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownedEth
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 0.0000001 ETH on Ethereum');
  });

  it('should return owned custom token on ethereum condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownedCustomToken
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 12 of Pepe tokens on Ethereum');
  });

  it('should return specific POAP condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownsSpecificPoap,
      operator: 'OR'
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owner of a ETHDenver POAP on Gnosis or Owner of a ETHDenver POAP on Ethereum');
  });

  it('should return owns any POAP condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: ownsAnyPoap
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns any POAP');
  });

  it('should return the owner of a dao condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: daoMember
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Is a member of the DAO at 0x3806…ddce');
  });

  it('should return the owner of at least 1 NFT from a specific collection condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: nftCollectionOwner
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 of Charmed & Optimistic NFT on Optimism');
  });

  it('should return the owner of a specific nft condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: specificNftOwner
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owner of Charmed & Optimistic 71 NFT with token id 71 on Optimism');
  });

  it('should return an erc1155 condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: multipleErc
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 of Charmed & Optimistic 71 tokens with token id 72 on Ethereum');
  });

  it('should return an unlock protocol condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: unlockProtocolCondition
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Unlock Protocol - The Cool One');
  });

  it('should return a hypersub condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: hypersubCondition
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Hypersub - The Cool One');
  });

  it('should return a Guild condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: guildCondition
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Guild.xyz charmverse-guild');
  });

  it('should return a Gitcoin passport condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: gitcoinCondition
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Gitcoin Passport with a minimum score of 1');
  });
});
