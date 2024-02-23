import { Typography, Box } from '@mui/material';

import { Button } from 'components/common/Button';
import { CircularProgressWithLabel } from 'components/common/CircularProgressWithLabel/CircularProgressWithLabel';
import type { UploadedFileCallback } from 'hooks/useS3UploadInput';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

type Props = {
  onComplete: UploadedFileCallback;
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
};

export function FileUploadForm({ onComplete, align = 'center', disabled }: Props) {
  const { inputRef, openFilePicker, onFileChange, isUploading, progress, fileName, sizeLimit } = useS3UploadInput({
    onFileUpload: onComplete
  });

  return (
    <Box
      flexDirection='column'
      display='flex'
      key='upload'
      sx={{
        display: 'flex',
        justifyContent: align,
        alignItems: align
      }}
    >
      <input type='file' hidden onChange={onFileChange} ref={inputRef} />

      <Box height='40px'>
        {isUploading || (progress > 0 && progress !== 100) ? (
          <Box display='flex' alignItems={align} gap={1}>
            <Typography color='secondary' variant='subtitle1'>
              Uploading: {fileName || ''}
            </Typography>
            <CircularProgressWithLabel progress={progress} />
          </Box>
        ) : (
          <Box display='flex' alignItems='center' gap={1}>
            <Typography color='secondary' variant='subtitle1'>
              Select a file to upload
            </Typography>
            <Typography color='secondary' variant='caption'>
              (max {sizeLimit}MB)
            </Typography>
          </Box>
        )}
      </Box>

      <Button
        size='small'
        disabled={disabled}
        loading={isUploading}
        component='label'
        variant='contained'
        onClick={openFilePicker}
      >
        Choose a file
      </Button>
    </Box>
  );
}
