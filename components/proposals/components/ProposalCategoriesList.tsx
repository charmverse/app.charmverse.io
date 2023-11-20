import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Menu, MenuItem, MenuList, Paper, Stack, TextField, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import Modal from 'components/common/Modal';
import { ProposalCategoryChip } from 'components/proposals/components/ProposalChip';
import { ProposalCategoryContextMenu } from 'components/proposals/components/ProposalViewOptions/components/ProposalCategoryContextMenu';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BrandColor } from 'theme/colors';
import { brandColorNames } from 'theme/colors';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

const ColorBox = styled(Box)`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
`;

export function ProposalCategoriesList() {
  const { categories } = useProposalCategories();
  const [categoryColor, setCategoryColor] = useState<BrandColor>(getRandomThemeColor());
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const popupState = usePopupState({ variant: 'popover', popupId: `change-category-color` });

  const isAdmin = useIsAdmin();

  const { showMessage } = useSnackbar();
  const [newCategoryName, setNewCategoryName] = useState('');
  const { addCategory } = useProposalCategories();

  async function createCategory() {
    addCategory({ title: newCategoryName, color: categoryColor })
      .then(() => {
        setNewCategoryName('');
        setCategoryColor(getRandomThemeColor());
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
        <Stack gap={1} mb={2} flexDirection='row'>
          <Stack gap={0.5} flexGrow={1}>
            <FieldLabel variant='subtitle2'>Name</FieldLabel>
            <TextField
              data-test='add-category-input'
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
          </Stack>

          <Stack gap={0.5}>
            <FieldLabel variant='subtitle2'>Color</FieldLabel>
            <ColorBox
              sx={{
                backgroundColor: (theme) => theme.palette[categoryColor].main
              }}
              {...bindTrigger(popupState)}
            />
            <Menu
              {...bindMenu(popupState)}
              PaperProps={{
                sx: { width: 300 }
              }}
            >
              {brandColorNames.map((color) => (
                <MenuItem
                  key={color}
                  sx={{ textTransform: 'capitalize', display: 'flex', gap: 1, justifyContent: 'space-between' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoryColor(color);
                    popupState.close();
                  }}
                >
                  <Stack flexDirection='row' gap={1} alignContent='center'>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '20%',
                        backgroundColor: (theme) => theme.palette[color].main
                      }}
                    />
                    <Typography variant='subtitle1'>{color}</Typography>
                  </Stack>

                  {color === categoryColor && <CheckIcon fontSize='small' />}
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Stack>
        <Button
          data-test='confirm-new-category-button'
          disabled={categories.find((category) => category.title === newCategoryName) || !newCategoryName}
          onClick={createCategory}
        >
          Add
        </Button>
      </Modal>
    </>
  );
}
