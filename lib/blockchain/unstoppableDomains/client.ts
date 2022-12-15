import type { UnstoppableDomainsAuthSig } from './server';

export function extractProofParams(authSig: UnstoppableDomainsAuthSig) {
  const proof = authSig.idToken.proof;
  const proofContent = Object.values(proof)[0];
  const proofParams = proofContent.template.params;
  return proofParams;
}
export function extractDomainFromProof(authSig: UnstoppableDomainsAuthSig) {
  const proof = extractProofParams(authSig);
  return proof.uri.split(`uns:`)[1];
}
