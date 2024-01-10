import { Box } from '@mui/material';

import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { usePages } from 'hooks/usePages';

import { AddPagePermissionsInput } from '../common/AddPagePermissionsInput';
import { ReadonlyPagePermissionRow } from '../common/ReadonlyPagePermissionRow';

type Props = {
  pageId: string;
};

export default function FreePagePermissions({ pageId }: Props) {
  return (
    <Box>
      <UpgradeWrapper upgradeContext='page_permissions'>
        <AddPagePermissionsInput />
      </UpgradeWrapper>

      <Box display='block' py={0.5}>
        <UpgradeWrapper upgradeContext='page_permissions'>
          <ReadonlyPagePermissionRow assignee='Default permissions' value='Editor' />
        </UpgradeWrapper>
      </Box>
    </Box>
  );
}
