import { getFile, getFilePath, getUserProfilePhotos } from './methods';

export async function getUserAvatar(userId: number) {
  const photos = await getUserProfilePhotos({ user_id: userId });
  const photo = photos.result?.photos?.[0]?.[0];

  if (!photo?.file_id) {
    return null;
  }

  const file = await getFile({ file_id: photo.file_id });
  const internalPath = file.result?.file_path;

  if (!internalPath) {
    return null;
  }

  const path = getFilePath(internalPath);

  return path;
}
