import type { ProposalCategoryPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalCategory } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';

import Modal from 'components/common/Modal';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import { FreeProposalCategoryPermissions } from './components/FreeProposalCategoryPermissions/FreeProposalCategoryPermissions';
import { PaidProposalCategoryPermissions } from './components/PaidProposalCategoryPermissions/PaidProposalCategoryPermissions';

/**
 * @permissions The actions a user can perform on a proposal category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this proposal category
 */
type Props = {
  proposalCategory: ProposalCategory;
  permissions: ProposalCategoryPermissionFlags;
};
function ProposalCategoryPermissions({ proposalCategory, permissions }: Props) {
  const { isFreeSpace } = useIsFreeSpace();
  return (
    <Box data-test='category-permissions-dialog'>
      {isFreeSpace ? (
        <FreeProposalCategoryPermissions proposalCategory={proposalCategory} />
      ) : (
        <PaidProposalCategoryPermissions proposalCategory={proposalCategory} permissions={permissions} />
      )}
    </Box>
  );
}

type ProposalCategoryDialogProps = Props & {
  onClose: () => void;
  open: boolean;
};

export function ProposalCategoryPermissionsDialog({
  proposalCategory,
  onClose,
  open,
  permissions
}: ProposalCategoryDialogProps) {
  return (
    <Modal
      mobileDialog
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
      title={`${proposalCategory.title} permissions`}
      open={open}
    >
      <ProposalCategoryPermissions proposalCategory={proposalCategory} permissions={permissions} />
    </Modal>
  );
}
