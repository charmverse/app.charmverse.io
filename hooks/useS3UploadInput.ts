import { log } from '@charmverse/core/log';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useFilePicker } from 'hooks/useFilePicker';
import { useSnackbar } from 'hooks/useSnackbar';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

export const DEFAULT_MAX_FILE_SIZE_MB = 20;

export type UploadedFileInfo = { url: string; fileName: string; size?: number };
export type UploadedFileCallback = (info: UploadedFileInfo) => void;

export const useS3UploadInput = (
  onFileUpload: UploadedFileCallback,
  fileSizeLimitMB: number = DEFAULT_MAX_FILE_SIZE_MB,
  resize: boolean = false
) => {
  const { showMessage } = useSnackbar();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  async function uploadFile(file: File) {
    if (file.size > fileSizeLimitMB * 1024 ** 2) {
      showMessage(`File size must be less than ${fileSizeLimitMB}MB`, 'error');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setFileName(file.name || '');

    try {
      if (resize) {
        try {
          file = await charmClient.resizeImage(file);
        } catch (err) {
          log.error('Error resizing image', { err });
        }
      }
      const { url } = await uploadToS3(file, { onUploadPercentageProgress: setProgress });
      onFileUpload({ url, fileName: file.name || '', size: file.size });
    } catch (error) {
      log.error('Error uploading image to s3', { error });
      showMessage('Failed to upload file. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }

  return { ...useFilePicker(uploadFile), isUploading, progress, fileName, sizeLimit: fileSizeLimitMB };
};
