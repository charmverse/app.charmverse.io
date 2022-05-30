
import { Box, Divider, Grid, Link as ExternalLink, Stack, SvgIcon, Typography, Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import PoapIcon from 'public/images/poap_logo.svg';

const StyledBox = styled(Box)`
    background-color: #E9EDF5;
    border-radius: 5px;
`;

function PoapSection () {

  return (
    <StyledBox>
      <Stack direction='row' justifyContent='space-around' p={1}>
        <Typography variant='h1'>My POAPs</Typography>
        <SvgIcon viewBox='0 0 39 51' sx={{ marginTop: '-10px' }}>
          <PoapIcon />
        </SvgIcon>
        <Link external href={userLink} target='_blank'>{userPath}</Link>
        <h1>Manage</h1>
      </Stack>

    </StyledBox>
  );
}

export default PoapSection;
