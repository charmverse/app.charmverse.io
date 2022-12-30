import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFilePicker } from 'hooks/useFilePicker';
import { usePages } from 'hooks/usePages';
import type { PagesMap } from 'lib/pages';

export function ImportZippedMarkdown() {
  const space = useCurrentSpace();
  const { mutatePagesList } = usePages();
  const [uploading, setIsUploading] = useState(false);

  const { inputRef, onFileChange, openFilePicker } = useFilePicker((file) => {
    setIsUploading(true);
    charmClient.file
      .uploadZippedMarkdown({
        spaceId: space!.id,
        file
      })
      .then((pages) => {
        const pageMap = pages.reduce((acc, page) => {
          acc[page.id] = page;
          return acc;
        }, {} as PagesMap);
        mutatePagesList(pageMap);
      })
      .finally(() => setIsUploading(false));
  });

  return (
    <Box display='inline'>
      <Button
        startIcon={
          <SvgIcon>
            <DriveFolderUploadIcon sx={{ fontSize: 60 }} />
          </SvgIcon>
        }
        loading={uploading}
        variant='outlined'
        onClick={openFilePicker}
      >
        {uploading ? 'Uploading...' : 'Import zipped Markdown files'}
      </Button>
      <br />
      <input ref={inputRef} hidden onChange={onFileChange} accept='.zip' id='file' name='file' type='file' />
    </Box>
  );
}
