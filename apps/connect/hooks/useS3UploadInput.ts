import { log } from '@charmverse/core/log';
import { useState } from 'react';

import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
import type { ResizeType } from 'lib/utils/file';
import { DEFAULT_MAX_FILE_SIZE_MB, FORM_DATA_FILE_PART_NAME, FORM_DATA_IMAGE_RESIZE_TYPE } from 'lib/utils/file';
import { replaceS3Domain } from 'lib/utils/url';

import { connectApiClient } from '../apiClient/apiClient';

import { useFilePicker } from './useFilePicker';

export type UploadedFileInfo = { url: string; fileName: string; size?: number };
export type UploadedFileCallback = (info: UploadedFileInfo) => void;

export const useS3UploadInput = ({
  onFileUpload,
  fileSizeLimitMB = DEFAULT_MAX_FILE_SIZE_MB,
  resizeType,
  onError
}: {
  onError?: (message: string) => void;
  onFileUpload: UploadedFileCallback;
  fileSizeLimitMB?: number;
  resizeType?: ResizeType;
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
      // dont resize SVG images
      const isSVGImage = file.type === 'image/svg+xml';
      if (resizeType && !isSVGImage) {
        const formData = new FormData();
        formData.append(FORM_DATA_FILE_PART_NAME, file);
        formData.append(FORM_DATA_IMAGE_RESIZE_TYPE, resizeType);
        const { url } = await connectApiClient.image.resize(formData);
        onFileUpload({ url: replaceS3Domain(url), fileName: file.name || '', size: file.size });
      } else {
        const { url } = await uploadToS3(file, { onUploadPercentageProgress: setProgress });
        onFileUpload({ url: replaceS3Domain(url), fileName: file.name || '', size: file.size });
      }
    } catch (error) {
      log.error('Error uploading image to s3', { error });
      onError?.('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return { ...useFilePicker(uploadFile), isUploading, progress, fileName, sizeLimit: fileSizeLimitMB };
};
