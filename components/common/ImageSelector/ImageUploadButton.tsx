import { log } from '@charmverse/core/log';
import type { ButtonProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';

import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

import { PimpedButton } from '../Button';

export function ImageUploadButton({
  setImage,
  isUploading,
  setIsUploading,
  uploadDisclaimer,
  variant = 'outlined',
  ...props
}: {
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  setImage: (image: string) => void;
  uploadDisclaimer?: string;
  variant?: ButtonProps['variant'];
} & ButtonProps) {
  return (
    <Stack alignItems='center' gap={1}>
      <PimpedButton
        loading={isUploading}
        loadingMessage='Uploading image'
        disabled={isUploading}
        component='label'
        variant={variant}
        {...props}
      >
        Choose an image
        <input
          disabled={isUploading}
          type='file'
          style={{
            opacity: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer'
          }}
          accept='image/*'
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={async (e) => {
            setIsUploading(true);
            const firstFile = e.target.files?.[0];
            if (firstFile) {
              try {
                const { url } = await uploadToS3(firstFile);
                setImage(url);
              } catch (error) {
                log.error('Error uploading image to s3', { error });
              }
            }
            setIsUploading(false);
          }}
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
