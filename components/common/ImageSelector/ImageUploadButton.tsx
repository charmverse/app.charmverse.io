import { log } from '@charmverse/core/log';
import type { ButtonProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';

import { useSnackbar } from 'hooks/useSnackbar';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

import { PimpedButton } from '../Button';

export function ImageUploadButton({
  setImage,
  isUploading,
  setIsUploading,
  uploadDisclaimer,
  variant = 'outlined',
  fileSizeLimit,
  ...props
}: {
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  setImage: (image: string) => void;
  uploadDisclaimer?: string;
  variant?: ButtonProps['variant'];
  // file size limit in megabytes
  fileSizeLimit?: number;
} & ButtonProps) {
  const { showMessage } = useSnackbar();
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
              if (firstFile.size > (fileSizeLimit ?? 10) * 1024 * 1024) {
                showMessage(`File size limit is ${fileSizeLimit ?? 10}MB`, 'error');
                setIsUploading(false);
                return;
              }
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
