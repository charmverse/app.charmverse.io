import type { TokenGate as PrismaTokenGate, Role } from '@charmverse/core/prisma';

export type TokenGateJoinType = 'public_bounty_token_gate' | 'token_gate';

type TokenGateFields = Pick<PrismaTokenGate, 'createdAt' | 'id' | 'spaceId'>;

export type ConditionType = 'sol' | 'evm' | 'cosmos';
export type AccessType =
  | 'ERC20'
  | 'ERC721'
  | 'ERC1155'
  | 'ContractMethod'
  | 'Wallet'
  | 'MolochDAOv2.1'
  | 'Builder'
  | 'POAP'
  | 'Unlock'
  | 'Hypersub'
  | 'GitcoinPassport'
  | 'Guildxyz'
  | 'Hats';
export type Operator = 'AND' | 'OR';
export type Method =
  | 'ownerOf'
  | 'balanceOf'
  | 'eth_getBalance'
  | 'members'
  | 'balanceOfBatch'
  | 'eventId'
  | 'eventName'
  | 'getHasValidKey';

export type AccessControlCondition = {
  /** Chain id. */
  chain: number;
  /**  We support Solana and EVMs. */
  condition: ConditionType;
  /** All token gate types we support. */
  type: AccessType;
  /** Contract address of the asset. */
  contractAddress: string;
  /** Method for querying the contract. */
  method: Method | string; // string for custom contract methods
  /** Value of any type of token gate. */
  tokenIds: string[];
  /** The quantity of an asset. e.g. 2 ETH */
  quantity: string;
  /** Optional Name of the asset */
  name?: string;
  /** Optional image of the asset */
  image?: string;
};

export type TokenGateConditions = {
  accessControlConditions: AccessControlCondition[];
  operator?: Operator;
};

export type TokenGate = { conditions: TokenGateConditions } & TokenGateFields;

type WithRoles = {
  tokenGateToRoles: { role: Pick<Role, 'id' | 'name'> }[];
};

export type TokenGateWithRoles = TokenGate & WithRoles;
