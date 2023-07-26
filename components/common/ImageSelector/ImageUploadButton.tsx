import type { ButtonProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';

import type { UploadedFileCallback } from 'hooks/useS3UploadInput';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

import { PimpedButton } from '../Button';

export function ImageUploadButton({
  setImage,
  uploadDisclaimer,
  variant = 'outlined',
  fileSizeLimitMB,
  ...props
}: {
  setImage: (image: string) => void;
  uploadDisclaimer?: string;
  variant?: ButtonProps['variant'];
  fileSizeLimitMB?: number;
} & ButtonProps) {
  const onFileUpload: UploadedFileCallback = ({ url }) => {
    setImage(url);
  };

  const { isUploading, onFileChange, inputRef, openFilePicker } = useS3UploadInput(onFileUpload, fileSizeLimitMB);

  return (
    <Stack alignItems='center' gap={1}>
      <PimpedButton
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
      </PimpedButton>
      {uploadDisclaimer && (
        <Typography variant='caption' color='secondary'>
          {uploadDisclaimer}
        </Typography>
      )}
    </Stack>
  );
}
