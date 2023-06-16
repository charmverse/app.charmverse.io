import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';

import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { usePages } from 'hooks/usePages';

import { AddPagePermissionsInput } from '../common/AddPagePermissionsInput';
import { ProposalPagePermissions } from '../common/ProposalPagePermissions';
import { ReadonlyPagePermissionRow } from '../common/ReadonlyPagePermissionRow';

const StyledInput = styled(Input)`
  padding-right: 0;
  position: relative;

  .MuiInputAdornment-root {
    display: block;
    height: 100%;
    max-height: none;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 100px;
    text-align: right;

    button {
      height: 100%;
    }
  }
`;

type Props = {
  pageId: string;
};

export default function FreePagePermissions({ pageId }: Props) {
  const { pages } = usePages();

  if (pages[pageId]?.type === 'proposal') {
    return <ProposalPagePermissions proposalId={pages[pageId]?.proposalId as string} />;
  }

  return (
    <Box p={1}>
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
