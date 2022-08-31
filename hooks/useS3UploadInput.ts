import { useFilePicker } from 'hooks/useFilePicker';
import { useSnackbar } from 'hooks/useSnackbar';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

export const useS3UploadInput = (onFileUpload: (url: string) => void) => {
  const { showMessage } = useSnackbar();

  async function uploadFile (file: File) {
    try {
      const { url } = await uploadToS3(file);
      onFileUpload(url);
    }
    catch (e) {
      showMessage('Failed to upload file. Please try again.', 'error');
    }

  }

  return useFilePicker(uploadFile);
};
