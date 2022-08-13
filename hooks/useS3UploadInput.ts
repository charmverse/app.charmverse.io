import { useFilePicker } from 'hooks/useFilePicker';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

export const useS3UploadInput = (onFileUpload: (url: string) => void) => {
  async function uploadFile (file: File) {
    const { url } = await uploadToS3(file);
    onFileUpload(url);
  }

  return useFilePicker(uploadFile);
};
