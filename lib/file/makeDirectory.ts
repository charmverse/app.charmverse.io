import fs from 'fs/promises';

import { log } from '@charmverse/core/log';

export async function makeDirectory(directory: string) {
  try {
    await fs.stat(directory);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(directory, { recursive: true });
    } else {
      log.error('Failed to create upload directory', { error });
    }
  }
}
