import CompleteIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Dangerous';
import WarningIcon from '@mui/icons-material/HourglassBottom';
import { Alert, Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import SvgIcon from '@mui/material/SvgIcon';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/notion/constants';
import type { FailedImportsError } from 'lib/notion/types';
import { deleteCookie, getCookie } from 'lib/utilities/browser';
import NotionIcon from 'public/images/notion_logo.svg';

interface NotionResponseState {
  error?: string;
  loading: boolean;
  warning?: string;
  failedImports?: FailedImportsError[];
}

export default function ImportNotionWorkspace () {
  const [notionState, setNotionState] = useState<NotionResponseState>({ loading: false });
  const { showMessage } = useSnackbar();
  const [modalOpen, setModalOpen] = useState(false);
  const { mutate } = useSWRConfig();
  const space = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const dispatch = useAppDispatch();

  const notionCode = getCookie(AUTH_CODE_COOKIE);
  const notionError = getCookie(AUTH_ERROR_COOKIE);

  useEffect(() => {
    if (space && notionCode && !notionState.loading) {
      setNotionState({ failedImports: [], loading: true });
      setModalOpen(true);
      deleteCookie(AUTH_CODE_COOKIE);
      charmClient.importFromNotion({
        code: notionCode,
        spaceId: space.id
      })
        .then(({ failedImports }) => {
          setNotionState({ failedImports, loading: false });
          mutate(`pages/${space.id}`);
          // Fetch all the focalboard blocks,
          // TODO: Refactor to only return the imported blocks
          dispatch(initialLoad({ spaceId: space.id }));
          if (failedImports.length === 0) {
            showMessage('Notion workspace successfully imported');
            closeModal();
          }
        })
        .catch((err) => {
          if (err.status === 504) {
            setNotionState({
              loading: false,
              warning: 'It can take up to an hour to import large Notion spaces. Your data will appear on the left navigation when the import is completed.'
            });
          }
          else {
            setNotionState({
              loading: false,
              error: err.message || err.error || 'Something went wrong. Please try again'
            });
          }
        });
    }
  }, [space]);

  // show errors from server
  useEffect(() => {
    if (notionError) {
      deleteCookie(AUTH_ERROR_COOKIE);
      setModalOpen(true);
      setNotionState({
        loading: false,
        error: notionError
      });
    }
  }, []);

  function closeModal () {
    setModalOpen(false);
  }

  return (
    <div>
      <Button
        disabled={!isAdmin}
        disabledTooltip='Only admins can import content from Notion'
        loading={notionState.loading}
        href={`/api/notion/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}`}
        variant='outlined'
        startIcon={(
          <SvgIcon sx={{ color: 'text.primary' }}>
            <NotionIcon />
          </SvgIcon>
        )}
      >
        {notionState.loading ? 'Importing pages from Notion' : 'Import pages from Notion'}
      </Button>
      <Modal open={modalOpen} onClose={closeModal} size='fluid'>
        <Box display='flex' alignItems='center' gap={2} flexDirection='column'>
          {notionState.loading && (
            <>
              <CircularProgress size={30} />
              <Typography sx={{ mb: 0 }}>
                Importing your files from Notion. This might take a few minutes...
              </Typography>
            </>
          )}
          {!notionState.loading && notionState.failedImports?.length && (
            <>
              <CompleteIcon color='success' fontSize='large' />
              <Typography sx={{ mb: 0 }}>
                Import complete! Pages where we encountered issues are highlighted below.
              </Typography>
            </>
          )}
          {notionState.warning && (
            <>
              <WarningIcon color='orange' fontSize='large' />
              <Typography sx={{ mb: 0 }} align='center'>
                {notionState.warning}
              </Typography>
            </>
          )}
          {notionState.error && (
            <>
              <ErrorIcon color='error' fontSize='large' />
              <Typography sx={{ mb: 0 }} align='center'>
                {notionState.error}
              </Typography>
            </>
          )}
        </Box>
        {notionState.failedImports && notionState.failedImports?.length > 0 && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            <Box sx={{
              display: 'flex', gap: 2, flexDirection: 'column'
            }}
            >
              {notionState.failedImports.map(failedImport => (
                <div key={failedImport.pageId}>
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
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={blockTrailsIndex}>
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
      </Modal>
    </div>
  );
}
