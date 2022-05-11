import charmClient from 'charmClient';

export async function deleteFromS3Browser (src: string) {
  const data = await charmClient.deleteFromS3(src);

  return data;
}
