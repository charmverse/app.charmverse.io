import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';

import { Typography } from 'components/common/Typography';
import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { usePages } from 'hooks/usePages';

import { ProposalPagePermissions } from '../PagePermissions/ProposalPagePermissions';

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

export default function PublicPagePermissions({ pageId }: Props) {
  const { pages } = usePages();

  if (pages[pageId]?.type === 'proposal') {
    return <ProposalPagePermissions proposalId={pages[pageId]?.proposalId as string} />;
  }

  return (
    <Box p={1}>
      <UpgradeWrapper upgradeContext='pagePermissions'>
        <Box mb={1}>
          <StyledInput
            placeholder='Add people, roles or emails'
            fullWidth
            readOnly
            endAdornment={
              <InputAdornment position='end'>
                <Button disableElevation>Invite</Button>
              </InputAdornment>
            }
          />
        </Box>
      </UpgradeWrapper>

      <Box display='block' py={0.5}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2'>Default permissions</Typography>
          <div style={{ width: '160px', textAlign: 'right' }}>
            <UpgradeWrapper upgradeContext='pagePermissions'>
              <Typography color='secondary' variant='caption'>
                Editor
              </Typography>
            </UpgradeWrapper>
          </div>
        </Box>
      </Box>
    </Box>
  );
}
