import { MerkleTree } from 'merkletreejs';
import type { Address } from 'viem';
import { keccak256, encodePacked } from 'viem/utils';

export type ProvableClaim = {
  address: Address;
  scoutId: string;
  amount: number;
};

function hashLeaf(claim: ProvableClaim): string {
  // Mimic Solidity's keccak256(abi.encodePacked(address, amount))
  const packedData = encodePacked(['address', 'uint256'], [claim.address, BigInt(claim.amount)]);
  return keccak256(packedData);
}

export function generateMerkleTree(claims: ProvableClaim[]): { tree: MerkleTree; rootHash: string } {
  const inputs = claims.map(hashLeaf);

  const tree = new MerkleTree(inputs, keccak256, {
    sort: true
    // concatenator: ([left, right]) => Buffer.from(hashLeaf(Buffer.concat([left, right]).toString()))
  });

  return {
    tree,
    rootHash: tree.getRoot().toString('hex')
  };
}

export function getMerkleProofs(tree: MerkleTree, claim: ProvableClaim): string[] {
  return tree.getHexProof(hashLeaf(claim));
}

export function verifyMerkleClaim(tree: MerkleTree, claim: ProvableClaim, proof: string[]): boolean {
  const root = tree.getRoot().toString('hex');
  return tree.verify(proof, hashLeaf(claim), root);
}
