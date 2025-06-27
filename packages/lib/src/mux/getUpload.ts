import type { Mux } from '@mux/mux-node';
import { log } from '@packages/core/log';

import { mux } from './muxClient';

type MuxUpload = Mux.Video.Upload;

export type Upload = {
  id: MuxUpload['id'];
  assetId: string;
  playbackId?: string;
  status: MuxUpload['status'];
};

export async function getUpload(uploadId: string): Promise<Upload> {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  try {
    const upload = await mux.video.uploads.retrieve(uploadId);
    if (!upload.asset_id) {
      throw new Error(`No asset id for mux upload. Upload id: ${uploadId}`);
    }
    const asset = await mux.video.assets.retrieve(upload.asset_id);
    const playbackId = asset.playback_ids?.[0].id;
    return {
      id: upload.id,
      assetId: upload.asset_id,
      playbackId,
      status: upload.status
    };
  } catch (error) {
    log.error('Error creating an upload to mux', { uploadId, error });
    const muxErrorMessage = (error as any).messages?.[0];
    throw new Error(muxErrorMessage || 'Error retrieving video from mux');
  }
}
