import { IconButton, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { Modal, DialogTitle } from 'components/common/Modal';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { Page, PageContent } from 'models';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import charmClient from 'charmClient';
import { mutate } from 'swr';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useState } from 'react';
import PageIcon from './PageIcon';

export default function TrashModal ({ onClose, isOpen }: {onClose: () => void, isOpen: boolean}) {
  const { deletedPages, getPagePermissions } = usePages();
  const [space] = useCurrentSpace();
  const [isMutating, setIsMutating] = useState(false);

  async function deletePagePermanently (pageId: string) {
    setIsMutating(true);
    await charmClient.deletePagePermanently(pageId);
    await mutate(`pages/deleted/${space?.id}`);
    setIsMutating(false);
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
      <div>
        <DialogTitle>Trash</DialogTitle>
        <List>
          {(Object
            .values(deletedPages)
            .filter(deletedPage => deletedPage && getPagePermissions(deletedPage.id).delete) as Page[]).map(deletedPage => {
            const isEditorEmpty = checkForEmpty(deletedPage.content as PageContent);
            return (
              <ListItem disabled={isMutating} key={deletedPage.id}>
                <PageIcon pageType={deletedPage.type} icon={deletedPage.icon} isEditorEmpty={isEditorEmpty} />
                <ListItemText>{deletedPage.title || 'Untitled'}</ListItemText>
                <div>
                  <IconButton disabled={isMutating} size='small'>
                    <Tooltip arrow placement='top' title='Restore page'>
                      <RestoreIcon color='info' fontSize='small' />
                    </Tooltip>
                  </IconButton>
                  <IconButton disabled={isMutating} size='small' onClick={() => deletePagePermanently(deletedPage.id)}>
                    <Tooltip arrow placement='top' title='Delete page permanently'>
                      <DeleteIcon color='error' fontSize='small' />
                    </Tooltip>
                  </IconButton>
                </div>
              </ListItem>
            );
          })}
        </List>
      </div>
    </Modal>
  );
}
