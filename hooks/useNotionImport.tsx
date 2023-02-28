import CompleteIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Dangerous';
import WarningIcon from '@mui/icons-material/HourglassBottom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import Modal from 'components/common/Modal';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/notion/constants';
import type { FailedImportsError } from 'lib/notion/types';
import { deleteCookie, getCookie } from 'lib/utilities/browser';

import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';

interface Props {
  children: JSX.Element;
}

type NotionImportState = {
  error?: string;
  loading: boolean;
  warning?: string;
  failedImports?: FailedImportsError[];
};

type INotionImportContext = {
  loading: boolean;
};

export const NotionImportContext = createContext<Readonly<INotionImportContext>>({
  loading: false
});

export function NotionProvider({ children }: Props) {
  const [notionState, setNotionState] = useState<NotionImportState>({ loading: false });
  const { showMessage } = useSnackbar();
  const [modalOpen, setModalOpen] = useState(false);
  const { mutate } = useSWRConfig();
  const space = useCurrentSpace();
  const dispatch = useAppDispatch();
  const notionCode = getCookie(AUTH_CODE_COOKIE);
  const notionError = getCookie(AUTH_ERROR_COOKIE);

  const { trigger } = useSWRMutation(
    '/notion/import',
    (_, { arg }: Readonly<{ arg: { code: string; spaceId: string } }>) => charmClient.importFromNotion(arg),
    {
      onSuccess(data) {
        if (space?.id) {
          mutate(`pages/${space.id}`);
          dispatch(initialLoad({ spaceId: space.id }));
        }
        setNotionState({ failedImports: data.failedImports, loading: false });
        if (data.failedImports.length === 0) {
          showMessage('Notion workspace successfully imported');
          closeModal();
        }
        return data?.failedImports ?? [];
      },
      onError(err) {
        if (err.status === 504) {
          setNotionState({
            loading: false,
            warning:
              'It can take up to an hour to import large Notion spaces. Your data will appear on the left navigation when the import is completed.'
          });
        } else {
          setNotionState({
            loading: false,
            error: notionError || err.message || err.error || 'Something went wrong. Please try again'
          });
        }
      }
    }
  );

  function closeModal() {
    setModalOpen(false);
  }

  useEffect(() => {
    if (space?.id && notionCode) {
      deleteCookie(AUTH_CODE_COOKIE);
      setModalOpen(true);
      setNotionState({ loading: true });
      trigger({ code: notionCode, spaceId: space.id });
    }
  }, [space?.id, notionCode]);

  const value = useMemo<INotionImportContext>(() => ({ loading: notionState.loading }), [notionState.loading]);

  return (
    <NotionImportContext.Provider value={value}>
      {children}
      <Modal open={modalOpen} onClose={closeModal} size='fluid'>
        <Box display='flex' alignItems='center' gap={2} flexDirection='column'>
          {notionState.loading && (
            <>
              <CircularProgress size={30} />
              <Typography sx={{ mb: 0 }}>Importing your files from Notion. This might take a few minutes...</Typography>
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
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: 'column'
              }}
            >
              {notionState.failedImports.map((failedImport) => (
                <div key={failedImport.pageId}>
                  <Box
                    sx={{
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
                          {blockTrailsIndex + 1}.{' '}
                          {blockTrails.map(([blockType, blockIndex]) => `${blockType}(${blockIndex + 1})`).join(' -> ')}
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
    </NotionImportContext.Provider>
  );
}

export const useNotionImport = () => useContext(NotionImportContext);
