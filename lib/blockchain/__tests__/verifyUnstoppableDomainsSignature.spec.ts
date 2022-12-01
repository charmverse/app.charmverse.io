import { verifyUnstoppableDomainsSignature, exampleSignature } from '../verifyUnstoppableDomainsSignature';

describe('verifyUnstoppableDomainsSignature', () => {
  const verifyAddress = '0x4A29c8fF7D6669618580A68dc691565B07b19e25';

  it('should verify the signature', () => {
    expect(verifyUnstoppableDomainsSignature(exampleSignature)).toBe(true);
  });
});
