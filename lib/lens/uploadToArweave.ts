import { POST } from 'adapters/http';

export const uploadToArweave = async (data: any): Promise<string> => {
  const response = await POST<string>('https://metadata.lenster.xyz', data, {
    headers: { 'Content-Type': 'application/json' },
    // remove credentials to bypass CORS error
    credentials: 'omit'
  });
  // Lenster response header content type is text/plain;charset=UTF-8, so we need to json parse it manually
  const { id } = JSON.parse(response);
  return id;
};
