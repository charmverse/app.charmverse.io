import * as React from 'react';

declare module 'lit-js-sdk' {

  // derived from https://github.com/LIT-Protocol/lit-js-sdk/blob/main/src/lib/constants.js
  type SolanaChain = 'solana' | 'solanaDevnet' | 'solanaTestnet';
  type EVMChain = 'ethereum' | 'polygon' | 'fantom' | 'xdai' | 'bsc'
    | 'arbitrum' | 'avalanche' | 'harmony' | 'kovan' | 'mumbai' | 'goerli' | 'ropsten'
    | 'rinkeby' | 'cronos' | 'optimism';
  export type Chain = EVMChain | SolanaChain;

  type ChainConfig = {
    chainId: string;
    contractAddress: string;
    name: string;
    symbol: string;
  }

  export const LIT_CHAINS: Record<EVMChain, ChainConfig>;
  export const ALL_LIT_CHAINS: Record<Chain, ChainConfig>;

  type ReturnValueTest = {
    key: string;
    comparator: string;
    value: string;
  }

  type ResourceId = {
    baseUrl: string;
    path: string;
    orgId: string;
    role: string;
    extraData: string;
  }

  type AuthSig = {
    address: string;
    sig: string;
    derivedVia: string;
    signedMessage: string;
  }

  export interface AccessControlCondition {
    contractAddress: string;
    chain: EVMChain;
    standardContractType: 'ERC20' | 'ERC721' | 'ERC1155';
    method: string;
    parameters: string[];
    returnValueTest: ReturnValueTest;
  }

  export interface EVMContractCondition {
    contractAddress: string;
    chain: EVMChain;
    functionName: string;
    functionParams: string[];
    functionAbi: any;
    returnValueTest: ReturnValueTest;
  }

  export interface SolRpcCondition {
    method: string;
    params: string[];
    chain: SolanaChain;
    returnValueTest: ReturnValueTest;
  }

  export interface SigningConditions {
    accessControlConditions?: (AccessControlCondition | AccessControlCondition[])[];
    evmContractConditions?: EVMContractCondition[];
    solRpcConditions?: SolRpcCondition[];
    chain: Chain;
    authSig: AuthSig;
    resourceId: ResourceId;
    permanant?: boolean = true;
  }

  export class LitNodeClient {

    connectedNodes: string[];

    ready: boolean;

    connect (): Promise<void>;

    getSignedToken (input: Omit<SigningConditions, 'permanent'>): Promise<string>;

    saveSigningCondition (conditions: SigningConditions): Promise<boolean>;

  }

  export async function checkAndSignAuthMessage (input: { chain: Chain }): Promise<AuthSig>;

  export async function verifyJwt (input: { jwt: string }): Promise<{
    verified: boolean;
    header: string;
    payload: unknown;
    signature: Uint8Array;
  }>;

  export function humanizeAccessControlConditions (input: {
    accessControlConditions: AccessControlCondition[];
    tokenList?: string[];
    myWalletAddress?: string;
  }): Promise<string>;

}
