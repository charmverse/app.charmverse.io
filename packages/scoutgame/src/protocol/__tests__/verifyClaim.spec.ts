import { generateMerkleTree, getMerkleProofs, verifyMerkleClaim, type ProvableClaim } from '../merkleTree';

const claimsInput: ProvableClaim[] = [
  {
    // Key here so we can copy to other tests: 57b7b9b29419b66ac8156f844a7b0eb18d94f729699b3f15a3d8817d3f5980a3
    address: '0x3F2A655d4e39E6c4470703e1063e9a843586886A',
    amount: 100
  },
  {
    // Key here so we can copy to other tests: aa03d22263ff3e4df4105a20d08f62873f5e100974862fdc1f99083ba11e6adc
    address: '0x2Fe1B8C9C8722f0D3e5B9a9D4115559bB8f04931',
    amount: 200
  },
  {
    // Key here so we can copy to other tests: c674865dde0163f480f818a78fc4d316c64d60b05666600734df8e8f37147f64
    address: '0x03F8B139fF6dbbb7475bAA5A71c16fcDD9495cc4',
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
