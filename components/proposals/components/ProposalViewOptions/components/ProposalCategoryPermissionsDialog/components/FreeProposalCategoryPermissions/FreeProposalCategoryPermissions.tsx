import type { ProposalCategory } from '@charmverse/core/prisma';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';

import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { AddRolesButton } from '../AddRolesButton';
import { ProposalCategoryRolePermissionRow } from '../ProposalCategoryPermissionRow';

/**
 * @permissions The actions a user can perform on a proposal category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this proposal category
 */
type Props = {
  proposalCategory: ProposalCategory;
};
export function FreeProposalCategoryPermissions({ proposalCategory }: Props) {
  const { space } = useCurrentSpace();

  return (
    <Grid container spacing={2}>
      {/** Leaving this here as it will already work for making proposal categories public

        <Grid item xs={12}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='body2'>Public category</Typography>
            <Switch
              data-test='toggle-public-page'
              checked={!!publicPermission}
              disabled={!permissions.manage_permissions}
              onChange={togglePublic}
            />
          </Box>
          <Typography variant='caption'>
            {!publicPermission
              ? 'Only space members with relevant permissions can view this category.'
              : 'Anyone on the web can view this category.'}
          </Typography>
        </Grid>
        <Divider sx={{ my: 2 }} />

           */}

      <Alert sx={{ mt: 2 }} severity='info'>
        All proposals beyond the draft stage are publicly visible in free spaces
      </Alert>

      <Grid item xs={12}>
        <ProposalCategoryRolePermissionRow
          canEdit={false}
          deletePermission={() => null}
          updatePermission={() => null}
          proposalCategoryId={proposalCategory.id}
          permissionLevel='full_access'
          assignee={{ group: 'space', id: space?.id as string }}
          disabledTooltip='Upgrade to a paid plan to configure permissions'
        />
      </Grid>

      <Grid item xs={12} display='flex' justifyContent='flex-start'>
        <UpgradeWrapper upgradeContext='proposal_permissions'>
          <AddRolesButton disabled />
        </UpgradeWrapper>
      </Grid>
    </Grid>
  );
}
