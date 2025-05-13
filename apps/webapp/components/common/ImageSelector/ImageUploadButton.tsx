import type { ButtonProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';
import type { ResizeType } from '@packages/utils/constants';

import type { UploadedFileCallback } from 'hooks/useS3UploadInput';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

import { Button } from '../Button';

export function ImageUploadButton({
  setImage,
  uploadDisclaimer,
  variant = 'contained',
  fileSizeLimitMB,
  resizeType,
  ...props
}: {
  setImage: (image: string) => void;
  uploadDisclaimer?: string;
  variant?: ButtonProps['variant'];
  fileSizeLimitMB?: number;
  resizeType: ResizeType;
} & ButtonProps) {
  const onFileUpload: UploadedFileCallback = ({ url }) => {
    setImage(url);
  };

  const { isUploading, onFileChange, inputRef, openFilePicker } = useS3UploadInput({
    onFileUpload,
    fileSizeLimitMB,
    resizeType
  });

  return (
    <Stack alignItems='center' gap={1}>
      <Button
        loading={isUploading}
        loadingMessage='Uploading image'
        disabled={isUploading}
        component='label'
        variant={variant}
        onClick={(e: any) => {
          // This is necessary to prevent the file picker to open multiple times (this happens in the sidebar)
          e.preventDefault();
          openFilePicker();
        }}
        {...props}
      >
        Choose an image
        <input
          ref={inputRef}
          disabled={isUploading}
          type='file'
          hidden
          accept='image/*'
          onClick={(e) => {
            // Without this the file picker doesn't open
            e.stopPropagation();
          }}
          onChange={onFileChange}
        />
      </Button>
      {uploadDisclaimer && (
        <Typography variant='caption' color='secondary'>
          {uploadDisclaimer}
        </Typography>
      )}
    </Stack>
  );
}
