import { log } from '@charmverse/core/log';
import { uploadToS3 } from '@root/lib/aws/uploadToS3Browser';
import { DEFAULT_MAX_FILE_SIZE_MB } from '@root/lib/file/constants';
import { encodeFilename } from '@root/lib/utils/encodeFilename';
import { replaceS3Domain } from '@root/lib/utils/url';
import { useState } from 'react';

import { useGetUploadToken } from './apiClient/aws';
import { useFilePicker } from './useFilePicker';

export type UploadedFileInfo = { url: string; fileName: string; size?: number };
export type UploadedFileCallback = (info: UploadedFileInfo) => void;

export const useS3UploadInput = ({
  onFileUpload,
  fileSizeLimitMB = DEFAULT_MAX_FILE_SIZE_MB,
  onError
}: {
  onError?: (message: string) => void;
  onFileUpload: UploadedFileCallback;
  fileSizeLimitMB?: number;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const { trigger } = useGetUploadToken();

  async function handleRequestUploadToken(file: File) {
    return trigger({ filename: encodeFilename(file.name) });
  }

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
      const { url } = await uploadToS3(handleRequestUploadToken, file, { onUploadPercentageProgress: setProgress });
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
