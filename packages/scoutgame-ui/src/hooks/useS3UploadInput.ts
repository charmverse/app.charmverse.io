import { log } from '@charmverse/core/log';
import { uploadToS3 } from '@packages/aws/uploadToS3Browser';
import { DEFAULT_MAX_FILE_SIZE_MB, encodeFilename } from '@packages/utils/file';
import { replaceS3Domain } from '@packages/utils/url';
import { useState } from 'react';

import { useFilePicker } from './useFilePicker';
import { useGetUploadToken } from './useGetUploadToken';

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
