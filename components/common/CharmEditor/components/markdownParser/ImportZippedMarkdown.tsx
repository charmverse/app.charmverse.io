import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import SvgIcon from '@mui/material/SvgIcon';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFilePicker } from 'hooks/useFilePicker';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PagesMap } from 'lib/pages';
import { SystemError } from 'lib/utilities/errors';

type Props = {
  onFile?: (file: File) => void;
};

export function ImportZippedMarkdown({ onFile }: Props) {
  const space = useCurrentSpace();
  const { mutatePagesList } = usePages();
  const [uploading, setIsUploading] = useState(false);
  const { showMessage } = useSnackbar();
  const isAdmin = useIsAdmin();

  async function defaultFileUploadSuccess(file: File) {
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
      });
  }

  const { inputRef, onFileChange, openFilePicker } = useFilePicker(async (file) => {
    setIsUploading(true);

    try {
      await (onFile ? onFile(file) : defaultFileUploadSuccess(file));
    } catch (err: any) {
      showMessage(err.message, err.severity ?? 'error');
    } finally {
      setIsUploading(false);
    }
  });

  return (
    <>
      <Button
        startIcon={
          <SvgIcon>
            <DriveFolderUploadIcon sx={{ fontSize: 60 }} />
          </SvgIcon>
        }
        // Default behaviour uploads to current space. Since onFile may upload to another space, we cannot rely on isAdmin hook
        disabled={!isAdmin && !onFile}
        disabledTooltip='Only admins can import a zipped markdown folder'
        loading={uploading}
        variant='outlined'
        onClick={openFilePicker}
      >
        {uploading ? 'Uploading...' : 'Import zipped Markdown files'}
      </Button>
      <br />
      <input ref={inputRef} hidden onChange={onFileChange} accept='.zip' id='file' name='file' type='file' />
    </>
  );
}
