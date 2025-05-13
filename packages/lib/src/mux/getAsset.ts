import type { Mux } from '@mux/mux-node';

import { getSignedToken } from './getSignedToken';
import { mux } from './muxClient';

type MuxAsset = Mux.Video.Asset;

export type Asset = {
  id: MuxAsset['id'];
  status: MuxAsset['status'];
  errors: MuxAsset['errors'];
  playbackId: string;
};

export async function getPrivateAsset(assetId: string): Promise<Asset> {
  const asset = await getAsset(assetId);

  // enable private access to the asset
  const token = await getSignedToken(asset.playbackId);
  asset.playbackId += `?token=${token}`;

  return asset;
}

async function getAsset(assetId: string): Promise<Asset> {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  const asset = await mux.video.assets.retrieve(assetId);
  // console.log('retrieved asset', asset.status, asset.playback_ids);
  if (!asset.playback_ids) {
    throw new Error('No playback ids');
  }
  return {
    id: asset.id,
    status: asset.status,
    errors: asset.errors,
    playbackId: asset.playback_ids[0].id
  };
}
