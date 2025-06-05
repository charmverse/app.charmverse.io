import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useTheme, IconButton, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { deleteCookie, getCookie } from '@packages/lib/utils/browser';
import type { NotionImportCompleted } from '@packages/websockets/interfaces';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { LoadingIcon } from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/notion/constants';
import type { FailedImportsError } from 'lib/notion/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';
import { useWebSocketClient } from './useWebSocketClient';

interface Props {
  children: JSX.Element;
}

type NotionImportState = {
  loading: boolean;
  failedImports: FailedImportsError[];
};

type INotionImportContext = {
  loading: boolean;
};

export const NotionImportContext = createContext<Readonly<INotionImportContext>>({
  loading: false
});

function NotionFailedImportsModal({ failedImports }: { failedImports: FailedImportsError[] }) {
  return (
    <Alert severity='warning' sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: 'column'
        }}
      >
        {failedImports.map((failedImport) => (
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
  );
}

export function NotionProvider({ children }: Props) {
  const [notionState, _setNotionState] = useState<NotionImportState>({ loading: false, failedImports: [] });
  const { showMessage, setActions, setAutoHideDuration } = useSnackbar();
  const { space } = useCurrentSpace();
  const notionCode = getCookie(AUTH_CODE_COOKIE);
  const notionError = getCookie(AUTH_ERROR_COOKIE);
  const { subscribe } = useWebSocketClient();
  const [isFailedImportsModalOpen, setIsFailedImportsModalOpen] = useState(false);

  const theme = useTheme();

  function setNotionState(partialNotionState: Partial<NotionImportState>) {
    _setNotionState({
      ...notionState,
      ...partialNotionState
    });
  }

  const { trigger } = useSWRMutation(
    '/notion/import',
    (_, { arg }: Readonly<{ arg: { code: string; spaceId: string } }>) => charmClient.importFromNotion(arg),
    {
      onError(err) {
        setNotionState({
          loading: false
        });
        if (err.status !== 504) {
          showMessage(
            notionError || err.message || err.error || 'Something went wrong with your notion import. Please try again',
            'error'
          );
        }
      }
    }
  );

  function handleNotionImportCompleted({
    totalImportedPages,
    totalPages,
    failedImports
  }: NotionImportCompleted['payload']) {
    setAutoHideDuration(null);
    if (totalImportedPages === totalPages && failedImports.length === 0) {
      showMessage('Notion workspace successfully imported', 'success');
      setNotionState({
        loading: false,
        failedImports: []
      });
    } else {
      showMessage(
        'Notion import completed! Click the view button to see which pages failed to be imported.',
        'warning'
      );
      setActions([
        <IconButton key='view'>
          <VisibilityOutlinedIcon
            onClick={() => {
              setIsFailedImportsModalOpen(true);
            }}
          />
        </IconButton>
      ]);
      setNotionState({
        loading: false,
        failedImports
      });
    }
  }

  useEffect(() => {
    if (space?.id && notionCode) {
      deleteCookie(AUTH_CODE_COOKIE);
      setNotionState({ loading: true, failedImports: [] });
      showMessage(
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <LoadingIcon
            size={16}
            style={{
              color: theme.palette.mode === 'dark' ? 'black' : 'white'
            }}
          />
          Importing your files from Notion
        </Stack>,
        'info'
      );
      setAutoHideDuration(null);
      trigger({ code: notionCode, spaceId: space.id });
    }
  }, [space?.id, notionCode]);

  useEffect(() => {
    const unsubscribeFromBlockUpdates = subscribe('notion_import_completed', handleNotionImportCompleted);
    return () => {
      unsubscribeFromBlockUpdates();
    };
  }, []);

  const value = useMemo<INotionImportContext>(() => ({ loading: notionState.loading }), [notionState.loading]);

  return (
    <NotionImportContext.Provider value={value}>
      {children}
      <Modal
        title='Failed Notion Imports'
        open={isFailedImportsModalOpen}
        onClose={() => {
          setIsFailedImportsModalOpen(false);
        }}
      >
        <NotionFailedImportsModal failedImports={notionState.failedImports} />
      </Modal>
    </NotionImportContext.Provider>
  );
}

export const useNotionImport = () => useContext(NotionImportContext);
