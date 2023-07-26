import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import Snackbar from 'components/common/Snackbar';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/notion/constants';
import type { FailedImportsError } from 'lib/notion/types';
import { deleteCookie, getCookie } from 'lib/utilities/browser';
import type { NotionImportCompleted } from 'lib/websockets/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';
import { useWebSocketClient } from './useWebSocketClient';

interface Props {
  children: JSX.Element;
}

type NotionImportState = {
  error?: string;
  loading: boolean;
  warning?: string;
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
  const { showMessage, setActions } = useSnackbar();
  const { space } = useCurrentSpace();
  const notionCode = getCookie(AUTH_CODE_COOKIE);
  const notionError = getCookie(AUTH_ERROR_COOKIE);
  const { subscribe } = useWebSocketClient();
  const [isFailedImportsModalOpen, setIsFailedImportsModalOpen] = useState(false);

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
        if (err.status === 504) {
          setNotionState({
            loading: false,
            warning:
              'It can take up to an hour to import large Notion spaces. Your data will appear on the left navigation when the import is completed.'
          });
        } else {
          setNotionState({
            loading: false,
            error:
              notionError ||
              err.message ||
              err.error ||
              'Something went wrong with your notion import. Please try again'
          });
        }
      }
    }
  );

  function handleNotionImportCompleted({
    totalImportedPages,
    totalPages,
    failedImports
  }: NotionImportCompleted['payload']) {
    // Only show this message if the import was not triggered by the user
    if (totalImportedPages === totalPages && failedImports.length === 0) {
      showMessage('Notion workspace successfully imported', 'success');
      setNotionState({
        loading: false,
        failedImports: []
      });
    } else {
      setNotionState({
        loading: false,
        failedImports,
        warning: `Notion import completed! Click the view button to see which pages failed to be imported.`
      });
    }
  }

  useEffect(() => {
    if (space?.id && notionCode) {
      deleteCookie(AUTH_CODE_COOKIE);
      setNotionState({ loading: true, failedImports: [] });
      showMessage('Importing your files from Notion.', 'info');
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
      <Snackbar
        severity={notionState.error ? 'error' : 'warning'}
        // For error and warning messages, we don't want the snackbar to auto hide
        autoHideDuration={null}
        isOpen={!!notionState.error || !!notionState.warning || notionState.failedImports.length !== 0}
        message={notionState.error ?? notionState.warning}
        handleClose={() => {
          setNotionState({
            error: undefined,
            warning: undefined,
            failedImports: []
          });
        }}
        actions={
          notionState.failedImports.length !== 0 && !notionState.loading
            ? [
                <IconButton key='view'>
                  <VisibilityOutlinedIcon
                    onClick={() => {
                      setIsFailedImportsModalOpen(true);
                    }}
                  />
                </IconButton>
              ]
            : []
        }
      />
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
