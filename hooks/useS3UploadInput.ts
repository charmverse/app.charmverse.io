import { log } from '@charmverse/core/log';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useFilePicker } from 'hooks/useFilePicker';
import { useSnackbar } from 'hooks/useSnackbar';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
import type { ResizeType } from 'lib/file/constants';
import { DEFAULT_MAX_FILE_SIZE_MB, FORM_DATA_FILE_PART_NAME, FORM_DATA_IMAGE_RESIZE_TYPE } from 'lib/file/constants';

export type UploadedFileInfo = { url: string; fileName: string; size?: number };
export type UploadedFileCallback = (info: UploadedFileInfo) => void;

export const useS3UploadInput = ({
  onFileUpload,
  fileSizeLimitMB = DEFAULT_MAX_FILE_SIZE_MB,
  resizeType
}: {
  onFileUpload: UploadedFileCallback;
  fileSizeLimitMB?: number;
  resizeType?: ResizeType;
}) => {
  const { showMessage } = useSnackbar();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  async function uploadFile(file: File) {
    if (file.size > fileSizeLimitMB * 1024 ** 2) {
      showMessage(`File size must be less than ${fileSizeLimitMB}MB`, 'error');
      return;
    }
    if (file.name.includes('.htm')) {
      showMessage('HTML files are not allowed', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setFileName(file.name || '');

    try {
      if (resizeType) {
        const formData = new FormData();
        formData.append(FORM_DATA_FILE_PART_NAME, file);
        formData.append(FORM_DATA_IMAGE_RESIZE_TYPE, resizeType);
        const { url } = await charmClient.resizeImage(formData);
        onFileUpload({ url, fileName: file.name || '', size: file.size });
      } else {
        const { url } = await uploadToS3(file, { onUploadPercentageProgress: setProgress });
        onFileUpload({ url, fileName: file.name || '', size: file.size });
      }
    } catch (error) {
      log.error('Error uploading image to s3', { error });
      showMessage('Failed to upload file. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }

  return { ...useFilePicker(uploadFile), isUploading, progress, fileName, sizeLimit: fileSizeLimitMB };
};
