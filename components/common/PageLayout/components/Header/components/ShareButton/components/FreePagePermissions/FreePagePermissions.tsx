import { Box } from '@mui/material';

import { useGetPageMeta } from 'charmClient/hooks/pages';
import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';

import { AddPagePermissionsInput } from '../common/AddPagePermissionsInput';
import { CopyLinkFooter } from '../common/CopyLinkFooter';
import { ReadonlyPagePermissionRow } from '../common/ReadonlyPagePermissionRow';

type Props = {
  pageId: string;
  onCopyLink: VoidFunction;
};

export default function FreePagePermissions({ pageId, onCopyLink }: Props) {
  const { data: page } = useGetPageMeta(pageId);
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
      <CopyLinkFooter pagePath={page?.path} onCopyLink={onCopyLink} />
    </Box>
  );
}
