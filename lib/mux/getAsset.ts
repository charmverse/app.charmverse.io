import type { Asset as MuxAsset } from '@mux/mux-node';

import { getSignedToken } from './getSignedToken';
import { mux } from './muxClient';

export type Asset = {
  id: string;
  status: MuxAsset['status'];
  errors: MuxAsset['errors'];
  playbackId: string;
};

export async function getAsset(assetId: string): Promise<Asset> {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  const asset = await mux.Video.Assets.get(assetId);
  if (!asset.playback_ids) {
    throw new Error('No playback ids');
  }
  const response = {
    id: asset.id,
    status: asset.status,
    errors: asset.errors,
    playbackId: asset.playback_ids[0].id
  };

  // enable private access to the asset
  const token = await getSignedToken(response.playbackId);
  response.playbackId += `?token=${token}`;

  return response;
}
