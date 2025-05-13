import { log } from '@charmverse/core/log';
import { POST } from '@packages/adapters/http';
import { isProdEnv } from '@packages/config/constants';

export const uploadToArweave = async (data: any): Promise<string | null> => {
  const response = await POST<{ id: string }>(
    isProdEnv ? 'https://api.hey.xyz/metadata' : 'https://api-testnet.hey.xyz/metadata',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        Referer: isProdEnv ? 'https://hey.xyz' : 'https://testnet.hey.xyz'
      },
      // remove credentials to bypass CORS error
      credentials: 'omit'
    }
  );
  try {
    const { id } = response;
    return `https://arweave.net/${id}`;
  } catch (error) {
    log.error('Failed to upload to Arweave', { error });
    throw error;
  }
};
