import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import AddIcon from '@mui/icons-material/Add';
import { Box, MenuItem, Select, TextField } from '@mui/material';
import Divider from '@mui/material/Divider';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { ViewOptions } from 'components/common/ViewOptions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

import { useProposalCategories } from '../../hooks/useProposalCategories';
import { ProposalCategoryChip } from '../ProposalChip';

import { ProposalCategoryContextMenu } from './components/ProposalCategoryContextMenu';

export type ProposalStatusFilter = ProposalStatus | 'all' | 'archived';

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
  setCategoryIdFilter,
  // Needed for the playwright selector to get the correct item (since we use this component twice)
  testKey = ''
}: Props & { testKey?: string }) {
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
      <Box data-test={`proposal-view-options-${testKey}`} display='flex' gap={1}>
        <Select
          sx={{ height: '32px' }}
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
          <Divider />
          <MenuItem value='archived'>Archived</MenuItem>
        </Select>
        <Select
          sx={{ height: '32px' }}
          data-test='proposal-category-list'
          variant='outlined'
          value={categoryIdFilter || ''}
          renderValue={(value) => {
            if (value === 'all') {
              return 'All categories';
            } else if (value === 'archived') {
              return 'Archived';
            }

            const category = categories.find((c) => c.id === value);
            if (category) {
              return <ProposalCategoryChip size='small' color={category.color} title={category.title} />;
            }
          }}
          onChange={(e) => {
            if (e.target.value) {
              setCategoryIdFilter(e.target.value);
            }
          }}
        >
          <MenuItem value='all'>All categories</MenuItem>
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
