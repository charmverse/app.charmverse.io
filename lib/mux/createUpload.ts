import { v4 as uuid } from 'uuid';

import { baseUrl } from 'config/constants';

import { mux } from './muxClient';

export async function createUpload() {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  const id = uuid();
  const upload = await mux.Video.Uploads.create({
    cors_origin: baseUrl,
    new_asset_settings: {
      passthrough: id,
      playback_policy: 'signed'
    }
  });
  return { id: upload.id, url: upload.url };
}
