import { useState } from 'react';

import { useFilePicker } from 'hooks/useFilePicker';
import { useSnackbar } from 'hooks/useSnackbar';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

const DEFAULT_MAX_FILE_SIZE_MB = 20;

export const useS3UploadInput = (onFileUpload: (url: string) => void) => {
  const { showMessage } = useSnackbar();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  async function uploadFile(file: File) {
    if (file.size > DEFAULT_MAX_FILE_SIZE_MB * 1024 ** 2) {
      showMessage(`File size must be less than ${DEFAULT_MAX_FILE_SIZE_MB}MB`, 'error');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setFileName(file.name || '');

    try {
      const { url } = await uploadToS3(file, { onUploadPercentageProgress: setProgress });
      onFileUpload(url);
    } catch (e) {
      showMessage('Failed to upload file. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }

  return { ...useFilePicker(uploadFile), isUploading, progress, fileName };
};
