import AddIcon from '@mui/icons-material/Add';
import { MenuItem, MenuList, TextField, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { ProposalCategoryChip } from 'components/proposals/components/ProposalChip';
import { ProposalCategoryContextMenu } from 'components/proposals/components/ProposalViewOptions/components/ProposalCategoryContextMenu';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

export function ProposalCategoriesList() {
  const { categories } = useProposalCategories();

  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });

  const isAdmin = useIsAdmin();

  const { showMessage } = useSnackbar();
  const [newCategoryName, setNewCategoryName] = useState('');
  const { addCategory } = useProposalCategories();

  async function createCategory() {
    addCategory({ title: newCategoryName, color: getRandomThemeColor() })
      .then(() => {
        setNewCategoryName('');
        addCategoryPopupState.close();
      })
      .catch((err) => {
        showMessage(err.message ?? 'Something went wrong', 'error');
      });
  }

  if (!categories) return null;

  return (
    <>
      <MenuList>
        {categories.map((category) => (
          <MenuItem
            data-test={`proposal-category-${category.id}`}
            key={category.id}
            value={category.id}
            sx={{ justifyContent: 'space-between' }}
          >
            <ProposalCategoryChip size='small' color={category.color} title={category.title} />
            <ProposalCategoryContextMenu category={category} key={category.id} />
          </MenuItem>
        ))}

        <Button
          sx={{ ml: 2, mt: 1 }}
          data-test='add-category-button'
          disabled={!isAdmin}
          startIcon={<AddIcon />}
          onClick={addCategoryPopupState.open}
          variant='outlined'
          color='secondary'
          size='small'
          disabledTooltip="You don't have the permissions to add new forum categories"
        >
          Add category
        </Button>
      </MenuList>

      <Modal
        open={addCategoryPopupState.isOpen}
        onClose={() => {
          addCategoryPopupState.close();
        }}
        title='Add proposal category'
      >
        <TextField
          data-test='add-category-input'
          sx={{
            mb: 1
          }}
          autoFocus
          fullWidth
          value={newCategoryName}
          onChange={(e) => {
            setNewCategoryName(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              createCategory();
            }
          }}
        />
        <Button
          data-test='confirm-new-category-button'
          disabled={categories.find((category) => category.title === newCategoryName)}
          onClick={createCategory}
        >
          Add
        </Button>
      </Modal>
    </>
  );
}
