import { baseUrl } from '@packages/config/constants';
import { v4 as uuid } from 'uuid';

import { mux } from './muxClient';

export async function createUpload() {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  // const id = uuid(); - the 'passthrough' concept might have a use in the future
  const upload = await mux.video.uploads.create({
    cors_origin: baseUrl!,
    new_asset_settings: {
      // passthrough: id,
      playback_policy: ['signed']
    }
  });

  return { id: upload.id, url: upload.url };
}
