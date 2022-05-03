import { IconButton, List, ListItem, ListItemText, ListItemIcon, Tooltip, Typography } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { ScrollableModal as Modal } from 'components/common/Modal';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { Page, PageContent } from 'models';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import charmClient from 'charmClient';
import { mutate } from 'swr';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemo, useState, ReactFragment } from 'react';
import { DateTime } from 'luxon';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import Link from 'components/common/Link';
import PageIcon from './PageIcon';

export default function TrashModal ({ onClose, isOpen }: {onClose: () => void, isOpen: boolean}) {
  const { pages, getPagePermissions } = usePages();
  const [space] = useCurrentSpace();
  const [isMutating, setIsMutating] = useState(false);
  const dispatch = useAppDispatch();

  const deletedPages = useMemo(() => (Object
    .values(pages)
    .filter(page => page && page.deletedAt !== null
        && getPagePermissions(page.id).delete) as Page[]).sort((deletedPageA, deletedPageB) => deletedPageA.deletedAt && deletedPageB.deletedAt
    ? new Date(deletedPageB.deletedAt).getTime() - new Date(deletedPageA.deletedAt).getTime()
    : 0), [pages]);

  async function deletePage (pageId: string) {
    setIsMutating(true);
    await charmClient.deletePage(pageId);
    await mutate(`pages/${space?.id}`);
    setIsMutating(false);
  }

  async function restorePages (pageId: string) {
    setIsMutating(true);
    await charmClient.restorePage(pageId);
    await mutate(`pages/${space?.id}`);
    dispatch(initialLoad());
    setIsMutating(false);
  }

  // Remove the pages you dont have delete access of
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={(
        <>
          Trash
          <Typography variant='subtitle1' color='secondary'>{deletedPages.length} pages</Typography>
        </>
      )}
    >
      {deletedPages.length === 0
        ? <Typography variant='subtitle1' color='secondary'>No archived pages</Typography>
        : (
          <List>
            {deletedPages.map(deletedPage => {
              const isEditorEmpty = checkForEmpty(deletedPage.content as PageContent);
              return (
                <ListItem disableGutters dense disabled={isMutating} key={deletedPage.id}>
                  <ListItemIcon>
                    <PageIcon pageType={deletedPage.type} icon={deletedPage.icon} isEditorEmpty={isEditorEmpty} />
                  </ListItemIcon>
                  <ListItemText secondary={DateTime.fromJSDate(new Date(deletedPage.deletedAt!)).toRelative({ base: (DateTime.now()) })}>
                    <Link color='inherit' href={`/${space?.domain}/${deletedPage.path}`}>
                      {deletedPage.title || 'Untitled'}
                    </Link>
                  </ListItemText>
                  <div>
                    <IconButton disabled={isMutating} size='small' onClick={() => restorePages(deletedPage.id)}>
                      <Tooltip arrow placement='top' title='Restore page'>
                        <RestoreIcon color='info' fontSize='small' />
                      </Tooltip>
                    </IconButton>
                    <IconButton disabled={isMutating} size='small' onClick={() => deletePage(deletedPage.id)}>
                      <Tooltip arrow placement='top' title='Delete page permanently'>
                        <DeleteIcon color='error' fontSize='small' />
                      </Tooltip>
                    </IconButton>
                  </div>
                </ListItem>
              );
            })}
          </List>
        )}
    </Modal>
  );
}
