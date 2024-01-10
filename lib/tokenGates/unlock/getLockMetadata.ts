import { GET } from '@charmverse/core/http';

const lockSmithAPI = 'https://locksmith.unlock-protocol.com/v2/api' as const;

type LockSmithMetadata = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: string[];
  external_url?: string | null;
};

export async function getLockMetadata({ chainId, contract }: { chainId: number; contract: string }) {
  return GET<LockSmithMetadata>(`${lockSmithAPI}/metadata/${chainId}/locks/${contract}`, null);
}
