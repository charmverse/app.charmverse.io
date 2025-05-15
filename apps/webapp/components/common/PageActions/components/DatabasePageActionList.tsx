import { log } from '@charmverse/core/log';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma-client';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerticalAlignBottomOutlinedIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { Divider, List } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import mutator from '@packages/databases/mutator';
import { getSortedBoards } from '@packages/databases/store/boards';
import { makeSelectViewCardsSortedFilteredAndGrouped } from '@packages/databases/store/cards';
import { useAppSelector } from '@packages/databases/store/hooks';
import { getCurrentBoardViews, getView } from '@packages/databases/store/views';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import type { ImportAction } from 'components/common/Modal/ConfirmImportModal';
import ConfirmImportModal from 'components/common/Modal/ConfirmImportModal';
import { AddToFavoritesAction } from 'components/common/PageActions/components/AddToFavoritesAction';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { DuplicatePageAction } from 'components/common/PageActions/components/DuplicatePageAction';
import { SetAsHomePageAction } from 'components/common/PageActions/components/SetAsHomePageAction';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { lockablePageTypes } from 'lib/pages/constants';

import { addNewCards, isValidCsvResult } from '../utils/databasePageOptions';

import { DocumentHistory } from './DocumentHistory';
import type { PageActionMeta } from './DocumentPageActionList';
import { TogglePageLockAction } from './TogglePageLockAction';

type Props = {
  onComplete: VoidFunction;
  page: PageActionMeta;
  pagePermissions?: PagePermissionFlags;
  refreshPage?: VoidFunction;
};

export function DatabasePageActionList({ pagePermissions, onComplete, page, refreshPage }: Props) {
  const pageId = page.id;
  const router = useRouter();
  const { pages, deletePage, mutatePagesRemove } = usePages();
  const [exportingDatabase, setExportingDatabase] = useState(false);
  const view = useAppSelector(getView(router.query.viewId as string));
  const boards = useAppSelector(getSortedBoards);
  const boardViews = useAppSelector(getCurrentBoardViews);
  const { showMessage } = useSnackbar();
  const { membersRecord } = useMembers();
  const { user } = useUser();
  const { space: currentSpace } = useCurrentSpace();
  const importConfirmationPopup = usePopupState({ variant: 'popover', popupId: 'import-confirmation-popup' });
  const localViewSettings = useLocalDbViewSettings(view?.id);

  useEffect(() => {
    if (view?.id && localViewSettings?.viewId !== view?.id) {
      localViewSettings?.setViewId(view?.id);
    }
  }, [localViewSettings, view?.id]);

  const activeBoardId = view?.fields.sourceData?.boardId ?? view?.fields.linkedSourceId ?? view?.rootId;
  const board = boards.find((b) => b.id === activeBoardId);
  const boardPage = pages[pageId];

  function undoChanges() {
    if (mutator.canUndo) {
      const description = mutator.undoDescription;
      mutator.undo().then(() => {
        showMessage(description ? `Undo ${description}` : 'Undo', 'success');
      });
    } else {
      showMessage('Nothing to Undo', 'info');
    }
  }

  const selectViewCardsSortedFilteredAndGrouped = useMemo(makeSelectViewCardsSortedFilteredAndGrouped, []);
  const cards = useAppSelector((state) =>
    selectViewCardsSortedFilteredAndGrouped(state, {
      boardId: board?.id ?? '',
      viewId: view?.id ?? ''
    })
  );

  const isLockablePageType = lockablePageTypes.includes(page.type as PageType);

  async function onTogglePageLock() {
    await charmClient.pages.togglePageLock({
      pageId: page.id,
      isLocked: !page.isLocked
    });
    refreshPage?.();
  }

  async function onDeletePage() {
    await deletePage({
      pageId
    });
    onComplete();
  }

  async function deleteCards() {
    const cardIds = cards.map((card) => card.id).filter((cardId) => pages[cardId] && !pages[cardId]?.deletedAt);
    await mutator.deleteBlocks(cardIds);
    mutatePagesRemove(cardIds);
  }

  async function exportZippedDatabase() {
    setExportingDatabase(true);
    try {
      const exportName = `${boardPage?.title ?? 'Untitled'} database export`;

      const generatedZip = await charmClient.pages.exportZippedDatabasePage({
        databaseId: pageId,
        filter: localViewSettings?.localFilters || null,
        viewId: view?.id
      });

      const zipDataUrl = URL.createObjectURL(generatedZip as any);

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = zipDataUrl;
      link.download = `${exportName}.zip`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(zipDataUrl);

      showMessage('Database exported successfully', 'success');

      charmClient.track.trackAction('export_page_csv', { pageId, spaceId: currentSpace?.id as string });
    } catch (error) {
      log.error(error);
      showMessage('Error exporting database', 'error');
    } finally {
      setExportingDatabase(false);
    }
  }

  const importCsv = (event: ChangeEvent<HTMLInputElement>, importAction?: ImportAction): void => {
    if (board && event.target.files && event.target.files[0]) {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        worker: event.target.files[0].size > 100000, // 100kb
        delimiter: '\n', // fallback for a csv with 1 column
        complete: async (results) => {
          onComplete();
          if (results.errors && results.errors[0]) {
            log.warn('CSV import failed', { spaceId: currentSpace?.id, pageId, error: results.errors[0] });
            showMessage(results.errors[0].message ?? 'There was an error importing your csv file.', 'warning');
            return;
          }

          if (isValidCsvResult(results)) {
            if (!user || !currentSpace) {
              throw new Error(
                'An error occured while importing. Please verify you have a valid user, space and board.'
              );
            }

            showMessage('Importing your csv file...', 'info');

            if (importAction === 'delete') {
              try {
                await deleteCards();
              } catch (error) {
                log.error('CSV Import - Deleting all the cards before importing failed', {
                  spaceId: currentSpace?.id,
                  pageId,
                  error
                });
                showMessage((error as Error).message || 'Failed to delete the old cards', 'error');
              }
            }

            try {
              await addNewCards({
                board,
                boardPageId: pageId,
                members: membersRecord,
                results,
                spaceId: currentSpace.id,
                userId: user.id,
                views: boardViews
              });

              const spaceId = currentSpace?.id;
              if (spaceId) {
                charmClient.track.trackAction('import_page_csv', { pageId, spaceId });
              }
              showMessage('Your csv file was imported successfully', 'success');
            } catch (error) {
              log.error('CSV import failed', { spaceId: currentSpace?.id, pageId, error });
              showMessage((error as Error).message || 'Import failed', 'error');
            }
          }
        }
      });
    }
  };

  if (!board || !view) {
    return null;
  }

  return (
    <List dense>
      <AddToFavoritesAction pageId={pageId} onComplete={onComplete} />
      <SetAsHomePageAction pageId={pageId} onComplete={onComplete} />
      {isLockablePageType && (
        <TogglePageLockAction
          isLocked={!!page.isLocked}
          onClick={onTogglePageLock}
          disabled={!pagePermissions?.edit_lock}
        />
      )}
      <DuplicatePageAction
        onComplete={onComplete}
        pageId={pageId}
        pageType={boardPage?.type}
        pagePermissions={pagePermissions}
      />
      <CopyPageLinkAction path={`/${boardPage?.path}`} onComplete={onComplete} />
      <Divider />
      <Tooltip title={!pagePermissions?.delete ? "You don't have permission to delete this page" : ''}>
        <div>
          <ListItemButton disabled={!pagePermissions?.delete} onClick={onDeletePage}>
            <DeleteOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Delete' />
          </ListItemButton>
        </div>
      </Tooltip>
      <Tooltip
        title={
          !pagePermissions?.edit_content
            ? "You don't have permission to undo changes"
            : !mutator.canUndo
              ? 'Nothing to undo'
              : ''
        }
      >
        <div>
          <ListItemButton disabled={!mutator.canUndo || !pagePermissions?.edit_content} onClick={undoChanges}>
            <UndoIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Undo' />
          </ListItemButton>
        </div>
      </Tooltip>
      <ListItemButton disabled={exportingDatabase} onClick={() => exportZippedDatabase()}>
        <UploadFileIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />

        <ListItemText primary={exportingDatabase ? 'Exporting data' : 'Export Pages & Data'} />
        {exportingDatabase && <LoadingComponent size={14} />}
      </ListItemButton>
      <ListItemButton
        component='label'
        {...(cards.length > 0 && bindTrigger(importConfirmationPopup))}
        htmlFor='csvfile'
      >
        <VerticalAlignBottomOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Import CSV' />
        {cards.length === 0 && (
          <input hidden type='file' id='csvfile' name='csvfile' accept='.csv' onChange={importCsv} />
        )}
      </ListItemButton>
      <Divider />
      <DocumentHistory
        page={{
          createdAt: new Date(board.createdAt),
          createdBy: board.createdBy,
          updatedAt: new Date(board.updatedAt),
          updatedBy: board.updatedBy,
          isLocked: page.isLocked,
          lockedBy: page.lockedBy
        }}
      />
      <ConfirmImportModal
        open={importConfirmationPopup.isOpen}
        onClose={importConfirmationPopup.close}
        onConfirm={importCsv}
        buttonText='Import'
        question='Choose how to manage your current data. Merge duplicate records or delete them entirely.'
      />
    </List>
  );
}
