import { mux } from './muxClient';

export async function getUpload(uploadId: string) {
  if (!mux) {
    throw new Error('Mux client not configured');
  }
  try {
    const upload = await mux.Video.Uploads.get(uploadId);
    return upload;
  } catch (error) {
    log.error('Error getting mux video', { error });
    const muxErrorMessage = (error as any).messages?.[0];
    throw new Error(muxErrorMessage || 'Error retrieving video from mux');
  }
}
