import { Typography } from '@mui/material';
import { Box } from '@mui/system';

import Button from 'components/common/Button';
import { CircularProgressWithLabel } from 'components/common/CircularProgressWithLabel/CircularProgressWithLabel';
import type { UploadedFileCallback } from 'hooks/useS3UploadInput';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

type Props = {
  onComplete: UploadedFileCallback;
};

export function FileUploadForm({ onComplete }: Props) {
  const { inputRef, openFilePicker, onFileChange, isUploading, progress, fileName, sizeLimit } =
    useS3UploadInput(onComplete);

  return (
    <Box
      flexDirection='column'
      display='flex'
      key='upload'
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <input type='file' hidden onChange={onFileChange} ref={inputRef} />

      <Box height='40px'>
        {isUploading || progress > 0 ? (
          <Box display='flex' alignItems='center' gap={1}>
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

      <Button component='label' variant='contained' onClick={openFilePicker}>
        Choose a file
      </Button>
    </Box>
  );
}
