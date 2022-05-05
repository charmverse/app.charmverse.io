import { IconButton, List, MenuItem, ListItemText, ListItemIcon, Tooltip, Typography, TextField, Box } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { ScrollableModal as Modal } from 'components/common/Modal';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { Page, PageContent } from 'models';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { MouseEvent, memo, useMemo, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { fancyTrim } from 'lib/utilities/strings';
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
  const { pages, deletePage, restorePage, getPagePermissions } = usePages();
  const [isMutating, setIsMutating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const archivedPages = useMemo(() => {
    const _archivedPages: Page[] = [];
    Object
      .values(pages).forEach(page => {
        if (page && page.deletedAt !== null && getPagePermissions(page.id).delete) {
          const pageTitle = page.title || 'Untitled';
          _archivedPages.push({ ...page, title: pageTitle });
        }
      });

    return _archivedPages.sort((deletedPageA, deletedPageB) => deletedPageA.deletedAt && deletedPageB.deletedAt
      ? new Date(deletedPageB.deletedAt).getTime() - new Date(deletedPageA.deletedAt).getTime()
      : 0);
  }, [pages]);

  const searchTextMatchedPages = useMemo(() => {
    return archivedPages.filter(archivedPage => archivedPage.title.toLowerCase().startsWith(searchText.toLowerCase()));
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

  // Remove the pages you dont have delete access of
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={(
        <Box width='100%'>
          <Box mb={1} display='flex' justifyContent='space-between'>
            Trash
            <Typography variant='body2' color='secondary'>{archivedPages.length} pages</Typography>
          </Box>
          {archivedPages.length !== 0 && (
          <TextField
            placeholder='Page 1'
            fullWidth
            sx={{
              '& .MuiFormHelperText-root': {
                margin: 0,
                marginTop: 0.5,
                opacity: 0.5,
                fontWeight: 500
              }
            }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            helperText='Type to filter archived pages by their title'
          />
          )}
        </Box>
      )}
    >
      {archivedPages.length === 0
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
