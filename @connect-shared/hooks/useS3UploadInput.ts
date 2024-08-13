import { log } from '@charmverse/core/log';
import { uploadToS3 } from '@root/lib/aws/uploadToS3Browser';
import { DEFAULT_MAX_FILE_SIZE_MB } from '@root/lib/file/constants';
import { replaceS3Domain } from '@root/lib/utils/url';
import { useState } from 'react';

import { useFilePicker } from './useFilePicker';

export type UploadedFileInfo = { url: string; fileName: string; size?: number };
export type UploadedFileCallback = (info: UploadedFileInfo) => void;
export type UploadImageFn = (file: File) => Promise<{
  token: any;
  bucket: string;
  key: string;
  region: string;
}>;

export const useS3UploadInput = ({
  onFileUpload,
  fileSizeLimitMB = DEFAULT_MAX_FILE_SIZE_MB,
  onError,
  uploadImageFn
}: {
  uploadImageFn: UploadImageFn;
  onError?: (message: string) => void;
  onFileUpload: UploadedFileCallback;
  fileSizeLimitMB?: number;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  async function uploadFile(file: File) {
    if (file.size > fileSizeLimitMB * 1024 ** 2) {
      onError?.(`File size must be less than ${fileSizeLimitMB}MB`);
      return;
    }
    if (file.name.includes('.htm')) {
      onError?.('HTML files are not allowed');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setFileName(file.name || '');

    try {
      const { url } = await uploadToS3(uploadImageFn, file, { onUploadPercentageProgress: setProgress });
      onFileUpload({ url: replaceS3Domain(url), fileName: file.name || '', size: file.size });
    } catch (error) {
      log.error('Error uploading image to s3', { error });
      onError?.('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return { ...useFilePicker(uploadFile), isUploading, progress, fileName, sizeLimit: fileSizeLimitMB };
};
