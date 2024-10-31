import { generateMerkleTree, getMerkleProofs, verifyMerkleClaim, type ProvableClaim } from '../merkleTree';

const claimsInput: ProvableClaim[] = [
  {
    address: '0x36446eF671954753801f9d73C415a80C0e550b32',
    amount: 100
  },
  {
    address: '0xC82ee528AC8BFd7087e0DE6548955601dFcac99d',
    amount: 200
  },
  {
    address: '0xB20C9b7e6b9cbcDed9819F88D68938D0B149887f',
    amount: 300
  },
  {
    address: '0x36446eF671954753801f9d73C415a80C0e550b32',
    amount: 400
  },
  {
    address: '0xD02953857250D32EC72064d9E2320B43296E52C0',
    amount: 500
  }
];

describe('verifyMerkleClaim', () => {
  it('should return true if the claim is valid', () => {
    const { tree } = generateMerkleTree(claimsInput);
    const claim = claimsInput[0];
    const proofs = getMerkleProofs(tree, claim);
    expect(verifyMerkleClaim(tree, claim, proofs)).toBe(true);
  });

  it('should return false if the claim is invalid', () => {
    const { tree } = generateMerkleTree(claimsInput);
    const claim: ProvableClaim = {
      address: '0x36446eF671954753801f9d73C415a80C0e550b32',
      amount: 200
    };
    const proof = getMerkleProofs(tree, claim);
    expect(verifyMerkleClaim(tree, claim, proof)).toBe(false);
  });

  it('should sort inputs so that it is not reliant on ordering of the claims', () => {
    function shuffleArray<T>(array: T[]): T[] {
      const newArray = [...array]; // Create a copy of the array to avoid mutating the original
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
      }
      return newArray;
    }

    const shuffledOne = shuffleArray(claimsInput);

    const shuffledTwo = shuffleArray(claimsInput);

    // Make sure sorting worked
    expect(JSON.stringify(shuffledOne)).not.toEqual(JSON.stringify(shuffledTwo));

    const { rootHash: rootHashOne } = generateMerkleTree(shuffledOne);
    const { rootHash: rootHashTwo } = generateMerkleTree(shuffledTwo);

    expect(rootHashOne).toEqual(rootHashTwo);
  });
});
