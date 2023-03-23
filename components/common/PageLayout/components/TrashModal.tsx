import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import {
  Box,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import LoadingComponent from 'components/common/LoadingComponent';
import { ScrollableModal as Modal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { usePages } from 'hooks/usePages';
import type { PageMeta, PagesMap } from 'lib/pages';
import { fancyTrim } from 'lib/utilities/strings';

import { PageIcon } from './PageIcon';

const PageArchivedDate = memo<{ date: Date; title: string }>(({ date, title }) => {
  return (
    <ListItemText secondary={DateTime.fromJSDate(new Date(date)).toRelative({ base: DateTime.now() })}>
      {fancyTrim(title, 34) || 'Untitled'}
    </ListItemText>
  );
});

const ArchivedPageItem = memo<{
  archivedPage: PageMeta;
  disabled: boolean;
  onRestore: (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => void;
  onDelete: (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => void;
}>(({ onRestore, onDelete, disabled, archivedPage }) => {
  const space = useCurrentSpace();

  return (
    <MenuItem
      data-test={`archived-page-${archivedPage.id}`}
      component={Link}
      href={`/${space?.domain}/${archivedPage.path}`}
      key={archivedPage.id}
      dense
      disabled={disabled}
      sx={{ pl: 4 }}
    >
      <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
        <PageIcon pageType={archivedPage.type} icon={archivedPage.icon} isEditorEmpty={!archivedPage.hasContent} />
      </ListItemIcon>
      <PageArchivedDate date={archivedPage.deletedAt as Date} title={archivedPage.title} />
      <div onClick={(e) => e.stopPropagation()}>
        <IconButton disabled={disabled} size='small' onClick={(e) => onRestore(e as any, archivedPage.id)}>
          <Tooltip arrow placement='top' title='Restore page'>
            <RestoreIcon color='info' fontSize='small' />
          </Tooltip>
        </IconButton>
        <IconButton disabled={disabled} size='small' onClick={(e) => onDelete(e as any, archivedPage.id)}>
          <Tooltip arrow placement='top' title='Delete page permanently'>
            <DeleteOutlinedIcon color='error' fontSize='small' />
          </Tooltip>
        </IconButton>
      </div>
    </MenuItem>
  );
});

export default function TrashModal({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  const [isMutating, setIsMutating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const space = useCurrentSpace();
  const currentPagePath = usePageIdFromPath();
  const { mutatePagesRemove, pages, getPageByPath } = usePages();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: archivedPages, mutate: setArchivedPages } = useSWR<PagesMap>(
    !space ? null : `archived-pages-${space?.id}`,
    () => {
      return charmClient.pages.getArchivedPages(space?.id as string).then((deletablePages) => {
        return deletablePages.reduce((pageMap, page) => {
          pageMap[page.id] = page;
          return pageMap;
        }, {} as PagesMap);
      });
    }
  );

  async function restorePage(pageId: string) {
    if (space) {
      const { pageIds: restoredPageIds } = await charmClient.restorePage(pageId);
      setArchivedPages((_archivedPages) => {
        if (!_archivedPages) {
          return {};
        }
        restoredPageIds.forEach((restoredPageId) => {
          if (_archivedPages[restoredPageId]) {
            delete _archivedPages[restoredPageId];
          }
        });
        return { ..._archivedPages };
      });

      await mutate(`pages/${space.id}`);
      dispatch(initialLoad({ spaceId: space.id }));
    }
  }

  async function deletePage(pageId: string) {
    const currentPage = currentPagePath ? getPageByPath(currentPagePath) : null;

    const { pageIds: deletePageIds } = await charmClient.deletePage(pageId);
    setArchivedPages((_archivedPages) => {
      if (!_archivedPages) {
        return {};
      }
      deletePageIds.forEach((deletePageId) => {
        if (_archivedPages[deletePageId]) {
          delete _archivedPages[deletePageId];
        }
      });
      return { ..._archivedPages };
    });

    mutatePagesRemove(deletePageIds);

    // If the current page has been deleted permanently route to the first alive page
    if (currentPage && deletePageIds.includes(currentPage.id)) {
      const firstPage = Object.values(pages).find((page) => page?.type !== 'card' && page?.deletedAt === null)?.path;
      router.push(`/${router.query.domain}/${firstPage}`);
    }
  }

  const searchTextMatchedPages = useMemo(() => {
    return Object.values(archivedPages ?? {}).filter(
      (archivedPage) => archivedPage && archivedPage.title.toLowerCase().includes(searchText.toLowerCase())
    ) as PageMeta[];
  }, [archivedPages, searchText]);

  const onRestorePage = useCallback(
    async (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => {
      e.preventDefault();
      setIsMutating(true);
      await restorePage(pageId);
      setIsMutating(false);
    },
    [isMutating]
  );

  const onDeletePage = useCallback(
    async (e: MouseEvent<HTMLButtonElement, MouseEvent>, pageId: string) => {
      e.preventDefault();
      setIsMutating(true);
      await deletePage(pageId);
      setIsMutating(false);
    },
    [isMutating]
  );

  const isLoading = !archivedPages;
  const archivedPagesExist = archivedPages && Object.keys(archivedPages).length > 0;

  // Remove the pages you dont have delete access of
  return (
    <Modal
      data-test='trash-modal'
      open={isOpen}
      onClose={onClose}
      title={
        <Box width='100%'>
          <Box mb={1} display='flex' justifyContent='space-between'>
            Trash
            <Typography variant='body2' color='secondary'>
              {!isLoading && `${Object.keys(archivedPages ?? {}).length} pages`}
            </Typography>
          </Box>
          {archivedPagesExist && (
            <TextField
              placeholder='Filter by page title...'
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          )}
        </Box>
      }
    >
      {isLoading && (
        <Box my={2}>
          <LoadingComponent />
        </Box>
      )}
      {!archivedPagesExist && !isLoading && (
        <Typography sx={{ pl: 4 }} variant='subtitle1' color='secondary'>
          No archived pages
        </Typography>
      )}
      {archivedPagesExist && !isLoading && (
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
