import { generateTree, getProofs, verifyClaim, type ProvableClaim } from '../root';

const claimsInput: ProvableClaim[] = [
  {
    address: '0x36446eF671954753801f9d73C415a80C0e550b32',
    amount: '100'
  },
  {
    address: '0xC82ee528AC8BFd7087e0DE6548955601dFcac99d',
    amount: '200'
  },
  {
    address: '0xB20C9b7e6b9cbcDed9819F88D68938D0B149887f',
    amount: '300'
  },
  {
    address: '0x36446eF671954753801f9d73C415a80C0e550b32',
    amount: '400'
  },
  {
    address: '0xD02953857250D32EC72064d9E2320B43296E52C0',
    amount: '500'
  }
];

describe('verifyClaim', () => {
  it('should return true if the claim is valid', () => {
    const tree = generateTree(claimsInput);
    const claim = claimsInput[0];
    const proofs = getProofs(tree, claim);
    expect(verifyClaim(tree, claim, proofs)).toBe(true);
  });

  it('should return false if the claim is invalid', () => {
    const tree = generateTree(claimsInput);
    const claim: ProvableClaim = {
      address: '0x36446eF671954753801f9d73C415a80C0e550b32',
      amount: '200'
    };
    const proof = getProofs(tree, claim);
    expect(verifyClaim(tree, claim, proof)).toBe(false);
  });
});
