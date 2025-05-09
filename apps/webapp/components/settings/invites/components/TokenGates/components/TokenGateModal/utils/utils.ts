export const collectableOptions = [
  { id: 'ERC721', name: 'ERC-721 NFT' },
  { id: 'ERC1155', name: 'ERC-1155 NFT' },
  { id: 'POAP', name: 'POAPS' },
  { id: 'Unlock', name: 'Unlock Protocol' },
  { id: 'Hypersub', name: 'Hypersub' }
] as const;

export const poapTypes = [
  { id: 'id', name: 'By Poap Id' },
  { id: 'name', name: 'By Poap Name' }
] as const;

export const poapNameMatch = [
  { id: 'exact', name: 'Contains POAP Name' },
  { id: 'contains', name: 'Equals POAP Name exactly' }
] as const;

export const tokenCheck = [
  { id: 'token', name: 'Check balance' },
  { id: 'customToken', name: 'Custom token' },
  { id: 'customContractMethod', name: 'Custom contract method' }
] as const;

export const nftCheck = [
  { id: 'group', name: 'Any NFT in this collection' },
  { id: 'individual', name: 'A specific token id' }
] as const;

export const daoCheck = [
  { id: 'hats', name: 'Hats Protocol' },
  { id: 'guild', name: 'Guild.xyz' },
  { id: 'builder', name: 'Builder Protocol' },
  { id: 'moloch', name: 'MolochDAOv2.1' }
] as const;

export const gitcoinPassportCheck = [
  { id: 'exists', name: 'Gitcoin Passport Owner' },
  { id: 'score', name: 'Gitcoin Passport Score' }
] as const;
