import NotionIcon from 'public/images/notion_logo.svg';
import SvgIcon from '@mui/material/SvgIcon';
import CircularProgress from '@mui/material/CircularProgress';
import { Alert, Box, Typography } from '@mui/material';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import charmClient from 'charmClient';
import { useSWRConfig } from 'swr';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'hooks/useSnackbar';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { FailedImportsError } from 'pages/[domain]/settings/workspace';

export default function ImportNotionWorkspace () {
  const router = useRouter();
  const [notionFailedImports, setNotionFailedImports] = useState<FailedImportsError[]>([]);
  const [notionImportError, setNotionImportError] = useState<string | null>(null);
  const { showMessage } = useSnackbar();
  const [isImportingFromNotion, setIsImportingFromNotion] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { mutate } = useSWRConfig();
  const [space] = useCurrentSpace();

  useEffect(() => {
    if (space && typeof router.query.code === 'string' && router.query.notion === '1' && !isImportingFromNotion) {
      setIsImportingFromNotion(true);
      setNotionFailedImports([]);
      setModalOpen(true);
      charmClient.importFromNotion({
        code: router.query.code,
        spaceId: space.id
      })
        .then(({ failedImports }) => {
          setIsImportingFromNotion(false);
          mutate(`pages/${space.id}`);
          if (failedImports.length > 0) {
            setNotionFailedImports(failedImports);
          }
          else {
            showMessage('Notion workspace successfully imported');
            closeModal();
          }
        })
        .catch((err) => {
          if (err.status === 504) {
            setNotionImportError('Timed out waiting for a response. Please come back later, it can take up to an hour if you are importing a lot of pages!');
          }
          else {
            setNotionImportError(err.message ?? err.error ?? 'Something went wrong. Please try again');
          }
          setIsImportingFromNotion(false);
        });
    }
  }, [space]);

  function closeModal () {
    setModalOpen(false);
  }

  return (
    <div>
      <Button
        disabled={isImportingFromNotion}
        loading={isImportingFromNotion}
        href={`/api/notion/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}`}
        variant='outlined'
        startIcon={(
          <SvgIcon sx={{ color: 'text.primary' }}>
            <NotionIcon />
          </SvgIcon>
      )}
      >
        {isImportingFromNotion ? 'Importing pages from Notion' : 'Import pages from Notion'}
      </Button>
      <Modal open={modalOpen} onClose={closeModal} size='fluid'>
        <Box display='flex' alignItems='center' gap={2} flexDirection='column'>
          {!notionImportError && notionFailedImports.length === 0 && <CircularProgress size={20} />}
          <Typography sx={{ mb: 0 }}>
            Importing your files from Notion. This might take a few minutes...
          </Typography>
        </Box>
        {notionFailedImports.length !== 0 && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            <Box sx={{
              display: 'flex', gap: 2, flexDirection: 'column'
            }}
            >
              Pages where we encountered issues
              {notionFailedImports.map(failedImport => (
                <div>
                  <Box sx={{
                    display: 'flex',
                    gap: 1
                  }}
                  >
                    <span>Type: {failedImport.type}</span>
                    <span>Title: {failedImport.title}</span>
                    <span>Id: {failedImport.pageId}</span>
                  </Box>
                  {failedImport.blocks.length !== 0 ? (
                    <div>
                      Blocks that failed to import for the page
                      {failedImport.blocks.map((blockTrails, blockTrailsIndex) => (
                        <div>
                          {blockTrailsIndex + 1}. {blockTrails.map(([blockType, blockIndex]) => `${blockType}(${blockIndex + 1})`).join(' -> ')}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </Box>
          </Alert>
        )}
        {notionImportError && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {notionImportError}
          </Alert>
        )}
      </Modal>
    </div>
  );
}
