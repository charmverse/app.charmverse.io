export const collectableOptions = [
  { id: 'ERC721', name: 'ERC-721 NFT' },
  { id: 'ERC1155', name: 'ERC-1155 NFT' },
  { id: 'POAP', name: 'POAPS' }
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
  { id: 'token', name: 'Check Balance' },
  { id: 'customToken', name: 'Custom token' }
] as const;

export const nftCheck = [
  { id: 'individual', name: 'An individual NFT' },
  { id: 'group', name: 'A group of NFT holders' }
] as const;
