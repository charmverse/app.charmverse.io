import { IconButton, List, MenuItem, ListItemText, ListItemIcon, Tooltip, Typography, TextField, Box } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { ScrollableModal as Modal } from 'components/common/Modal';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { Page, PageContent } from 'models';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { MouseEvent, memo, useMemo, useState, useCallback, useEffect } from 'react';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { fancyTrim } from 'lib/utilities/strings';
import charmClient from 'charmClient';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { mutate } from 'swr';
import { useRouter } from 'next/router';
import PageIcon from './PageIcon';

const PageArchivedDate = memo<{date: Date, title: string}>(({ date, title }) => {
  return (
    <ListItemText secondary={DateTime.fromJSDate(new Date(date)).toRelative({ base: (DateTime.now()) })}>
      {fancyTrim(title, 34) || 'Untitled'}
    </ListItemText>
  );
});

const ArchivedPageItem = memo<
{
  archivedPage: Page,
  disabled: boolean,
  onRestore:(e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => void,
  onDelete: (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => void
    }>(({ onRestore, onDelete, disabled, archivedPage }) => {
      const [space] = useCurrentSpace();
      const isEditorEmpty = checkForEmpty(archivedPage.content as PageContent);
      return (
        <Link href={`/${space?.domain}/${archivedPage.path}`} passHref key={archivedPage.id}>
          <MenuItem component='a' dense disabled={disabled} sx={{ pl: 4 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
              <PageIcon pageType={archivedPage.type} icon={archivedPage.icon} isEditorEmpty={isEditorEmpty} />
            </ListItemIcon>
            <PageArchivedDate date={archivedPage.deletedAt as Date} title={archivedPage.title} />
            <div onClick={e => e.stopPropagation()}>
              <IconButton
                disabled={disabled}
                size='small'
                onClick={(e) => onRestore(e as any, archivedPage.id)}
              >
                <Tooltip arrow placement='top' title='Restore page'>
                  <RestoreIcon color='info' fontSize='small' />
                </Tooltip>
              </IconButton>
              <IconButton
                disabled={disabled}
                size='small'
                onClick={(e) => onDelete(e as any, archivedPage.id)}
              >
                <Tooltip arrow placement='top' title='Delete page permanently'>
                  <DeleteIcon color='error' fontSize='small' />
                </Tooltip>
              </IconButton>
            </div>
          </MenuItem>
        </Link>
      );
    });

export default function TrashModal ({ onClose, isOpen }: {onClose: () => void, isOpen: boolean}) {
  const [archivedPages, setArchivedPages] = useState<Record<string, Page>>({});
  const [isMutating, setIsMutating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [space] = useCurrentSpace();
  const { pages, getPagePermissions, setPages, currentPageId } = usePages();
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    async function main () {
      if (space) {
        const _archivedPages: Page[] = [];
        (await charmClient.getArchivedPages(space.id)).forEach(archivedPage => {
          if (archivedPage && archivedPage.deletedAt !== null && getPagePermissions(archivedPage.id, archivedPage).delete) {
            const pageTitle = archivedPage.title || 'Untitled';
            _archivedPages.push({ ...archivedPage, title: pageTitle });
          }
        });
        setArchivedPages(_archivedPages.sort((deletedPageA, deletedPageB) => deletedPageA.deletedAt && deletedPageB.deletedAt
          ? new Date(deletedPageB.deletedAt).getTime() - new Date(deletedPageA.deletedAt).getTime()
          : 0).reduce((obj, cur) => ({ ...obj, [cur.id]: cur }), {}));
      }
    }
    main();
  }, [space]);

  async function restorePage (pageId: string) {
    if (space) {
      const { pageIds: restoredPageIds } = await charmClient.restorePage(pageId);
      setArchivedPages((_archivedPages) => {
        restoredPageIds.forEach(restoredPageId => {
          if (_archivedPages[restoredPageId]) {
            delete _archivedPages[restoredPageId];
          }
        });
        return { ..._archivedPages };
      });

      await mutate(`pages/${space.id}`);
      dispatch(initialLoad());
    }
  }

  async function deletePage (pageId: string) {
    const { pageIds: deletePageIds } = await charmClient.deletePage(pageId);
    setArchivedPages((_archivedPages) => {
      deletePageIds.forEach(deletePageId => {
        if (_archivedPages[deletePageId]) {
          delete _archivedPages[deletePageId];
        }
      });
      return { ..._archivedPages };
    });
    setPages((unArchivedPages) => {
      // Some deleted pages might still stay on the archived page state
      deletePageIds.forEach(deletedPageId => {
        if (unArchivedPages[deletedPageId]) {
          delete unArchivedPages[deletedPageId];
        }
      });
      return { ...unArchivedPages };
    });
    // If the current page has been deleted permanently route to the first alive page
    if (deletePageIds.includes(currentPageId)) {
      router.push(`/${router.query.domain}/${Object.values(pages).find(page => page?.type !== 'card' && page?.deletedAt === null)?.path}`);
    }
  }

  const searchTextMatchedPages = useMemo(() => {
    return Object.values(archivedPages).filter(archivedPage => archivedPage.title.toLowerCase().includes(searchText.toLowerCase()));
  }, [archivedPages, searchText]);

  const onRestorePage = useCallback(async (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => {
    e.preventDefault();
    setIsMutating(true);
    await restorePage(pageId);
    setIsMutating(false);
  }, [isMutating]);

  const onDeletePage = useCallback(async (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => {
    e.preventDefault();
    setIsMutating(true);
    await deletePage(pageId);
    setIsMutating(false);
  }, [isMutating]);

  const archivedPagesExist = Object.keys(archivedPages).length !== 0;

  // Remove the pages you dont have delete access of
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={(
        <Box width='100%'>
          <Box mb={1} display='flex' justifyContent='space-between'>
            Trash
            <Typography variant='body2' color='secondary'>{Object.keys(archivedPages).length} pages</Typography>
          </Box>
          { archivedPagesExist && (
          <TextField
            placeholder='Filter by page title...'
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          )}
        </Box>
      )}
    >
      {!archivedPagesExist
        ? <Typography sx={{ pl: 4 }} variant='subtitle1' color='secondary'>No archived pages</Typography>
        : (
          <List>
            {searchTextMatchedPages.map((archivedPage) => {
              return (
                <ArchivedPageItem
                  key={archivedPage.id}
                  archivedPage={archivedPage}
                  disabled={isMutating}
                  onDelete={onDeletePage}
                  onRestore={onRestorePage}
                />
              );
            })}
          </List>
        )}
    </Modal>
  );
}
