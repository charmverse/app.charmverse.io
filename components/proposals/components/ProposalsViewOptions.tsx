import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import AddIcon from '@mui/icons-material/Add';
import { Box, Chip, MenuItem, Select, TextField } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { ViewOptions } from 'components/common/ViewOptions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import type { BrandColor } from 'theme/colors';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

import { useProposalCategories } from '../hooks/useProposalCategories';

import { ProposalCategoryContextMenu } from './ProposalCategoryContextMenu';

export type ProposalStatusFilter = ProposalStatus | 'all';

type Props = {
  statusFilter: ProposalStatusFilter;
  setStatusFilter: (statusFilter: ProposalStatusFilter) => void;
  categoryIdFilter: string | null;
  setCategoryIdFilter: (val: string) => void;
  categories: ProposalCategoryWithPermissions[];
};

export function ProposalsViewOptions({
  statusFilter,
  setStatusFilter,
  categories,
  categoryIdFilter,
  setCategoryIdFilter
}: Props) {
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

  return (
    <ViewOptions label='Filter'>
      <Box display='flex' gap={1}>
        <Select
          variant='outlined'
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProposalStatusFilter)}
        >
          <MenuItem value='all'>All statuses</MenuItem>
          {Object.entries(PROPOSAL_STATUS_LABELS).map(([proposalStatus, proposalStatusLabel]) => (
            <MenuItem key={proposalStatus} value={proposalStatus}>
              {proposalStatusLabel}
            </MenuItem>
          ))}
        </Select>

        <Select
          variant='outlined'
          value={categoryIdFilter || ''}
          renderValue={(value) => {
            if (value === 'all') {
              return 'All categories';
            }

            const category = categories.find((c) => c.id === value);
            if (category) {
              return (
                <Chip
                  sx={{ cursor: 'pointer', minWidth: '100px' }}
                  color={category.color as BrandColor}
                  label={category.title}
                />
              );
            }
          }}
          onChange={(e) => setCategoryIdFilter(e.target.value)}
        >
          <MenuItem value='all'>All categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id} sx={{ justifyContent: 'space-between' }}>
              <Chip
                sx={{ cursor: 'pointer', minWidth: '100px' }}
                color={category.color as BrandColor}
                label={category.title}
              />
              {isAdmin && <ProposalCategoryContextMenu category={category} key={category.id} />}
            </MenuItem>
          ))}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            value=''
          >
            <Button
              data-test='add-category-button'
              sx={{
                ml: 2
              }}
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
          </MenuItem>
        </Select>
      </Box>

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
    </ViewOptions>
  );
}
