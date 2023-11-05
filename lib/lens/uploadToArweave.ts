import { log } from '@charmverse/core/log';

import { POST } from 'adapters/http';

export const uploadToArweave = async (data: any): Promise<string | null> => {
  const response = await POST<string>('https://metadata.lenster.xyz', data, {
    headers: { 'Content-Type': 'application/json' },
    // remove credentials to bypass CORS error
    credentials: 'omit'
  });
  // Lenster response header content type is text/plain;charset=UTF-8, so we need to json parse it manually
  try {
    const { id } = JSON.parse(response);
    return id;
  } catch (error) {
    log.error('Failed to upload to Arweave', { error });
    throw error;
  }
};
