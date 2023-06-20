import { Box } from '@mui/material';

import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { usePages } from 'hooks/usePages';

import { AddPagePermissionsInput } from '../common/AddPagePermissionsInput';
import { ProposalPagePermissions } from '../common/ProposalPagePermissions';
import { ReadonlyPagePermissionRow } from '../common/ReadonlyPagePermissionRow';

type Props = {
  pageId: string;
};

export default function FreePagePermissions({ pageId }: Props) {
  const { pages } = usePages();

  if (pages[pageId]?.type === 'proposal') {
    return <ProposalPagePermissions proposalId={pages[pageId]?.proposalId as string} />;
  }

  return (
    <Box>
      <UpgradeWrapper upgradeContext='pagePermissions'>
        <AddPagePermissionsInput />
      </UpgradeWrapper>

      <Box display='block' py={0.5}>
        <UpgradeWrapper upgradeContext='pagePermissions'>
          <ReadonlyPagePermissionRow assignee='Default permissions' value='Editor' />
        </UpgradeWrapper>
      </Box>
    </Box>
  );
}
