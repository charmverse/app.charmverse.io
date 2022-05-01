import { IconButton, List, ListItem, ListItemText } from '@mui/material';
import { usePages } from 'hooks/usePages';
import { Modal, DialogTitle } from 'components/common/Modal';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { PageContent } from 'models';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import PageIcon from './PageIcon';

export default function TrashModal ({ onClose, isOpen }: {onClose: () => void, isOpen: boolean}) {
  const { deletedPages } = usePages();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
      <div>
        <DialogTitle>Trash</DialogTitle>
        <List>
          {Object.values(deletedPages).map(deletedPage => {
            if (!deletedPage) {
              return null;
            }
            const isEditorEmpty = checkForEmpty(deletedPage.content as PageContent);
            return (
              <ListItem key={deletedPage.id}>
                <PageIcon pageType={deletedPage.type} icon={deletedPage.icon} isEditorEmpty={isEditorEmpty} />
                <ListItemText>{deletedPage.title || 'Untitled'}</ListItemText>
                <div>
                  <IconButton>
                    <RestoreIcon color='info' />
                  </IconButton>
                  <IconButton>
                    <DeleteIcon color='error' />
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
