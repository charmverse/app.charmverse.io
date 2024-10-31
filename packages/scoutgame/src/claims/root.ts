import { createHash } from 'node:crypto';

import { MerkleTree } from 'merkletreejs';
import type { Address } from 'viem';

export type ProvableClaim = {
  address: Address;
  amount: number;
};

function SHA256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function claimToString(claim: ProvableClaim): string {
  return `${claim.address}:${claim.amount}`;
}

export function generateTree(claims: ProvableClaim[]): MerkleTree {
  return new MerkleTree(claims.map(claimToString), SHA256);
}

export function getProofs(tree: MerkleTree, claim: ProvableClaim): any {
  return tree.getProof(claimToString(claim));
}

export function verifyClaim(tree: MerkleTree, claim: ProvableClaim, proof: string[]): boolean {
  const root = tree.getRoot().toString('hex');
  return tree.verify(proof, claimToString(claim), root);
}
