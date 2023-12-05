import { GET } from '@charmverse/core/http';

import { POST } from 'adapters/http';

import type { SignedCredential } from './attest';

type CredentialToSave = {
  credential: SignedCredential;
};

const CERAMIC_HOST = process.env.CERAMIC_HOST as string;

export async function saveToCeramic({ credential }: CredentialToSave): Promise<any> {
  if (!CERAMIC_HOST) {
    throw new Error('Ceramic unavailable');
  }
  const response = await POST(`${CERAMIC_HOST}/api/attest`, credential);

  return response;
}
export async function getReceivedCredentials({ account }: { account: string }): Promise<any> {
  if (!CERAMIC_HOST) {
    throw new Error('Ceramic unavailable');
  }
  const response = await GET(`${CERAMIC_HOST}/api/all`, { account });

  return response;
}
