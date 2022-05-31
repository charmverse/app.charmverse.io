import { useState } from 'react';
import { Box, Button, Container, Grid, ImageList, ImageListItem,
  Link as ExternalLink, Stack, SvgIcon, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import styled from '@emotion/styled';
import { usePopupState } from 'material-ui-popup-state/hooks';
import PoapIcon from 'public/images/poap_logo.svg';
import ManagePOAPModal from './ManagePOAPModal';

const StyledBox = styled(Box)`
    background-color: #E9EDF5;
    border-radius: 5px;
`;

const StyledTypographyManage = styled(Typography)`
  color: ${({ theme }) => theme.palette.primary.main};
  display: inline-flex;
`;

const StyledImage = styled.img`
  width: 100%;
`;

function PoapSection () {
  const [connectedWallet, setConnectedWallet] = useState('');
  const managePoapModalState = usePopupState({ variant: 'popover', popupId: 'poap-modal' });

  return (
    <StyledBox p={2}>
      <Grid container>
        <Grid item xs={8}>
          {
            connectedWallet ? <Typography variant='h1'>My POAPs</Typography>
              : <Typography>My POAPs</Typography>
          }
        </Grid>
        <Grid item container xs={4} justifyContent='space-around'>
          <SvgIcon
            viewBox='0 0 39 51'
            sx={{ width: '39px', height: '51px', marginTop: '-25%' }}
          >
            <PoapIcon />
          </SvgIcon>
        </Grid>
        <Grid item xs={12} pt={2}>
          <Box
            sx={{ alignItems: 'center', cursor: 'pointer', display: 'inline-flex' }}
            onClick={managePoapModalState.open}
          >
            <StyledTypographyManage>Manage</StyledTypographyManage>
            <IconButton>
              <EditIcon fontSize='small' />
            </IconButton>
          </Box>
        </Grid>
        <Grid item container xs={12}>
          <Grid item xs={4} p={1}>
            <StyledImage src='http://www.fillmurray.com/200/300' />
          </Grid>
          <Grid item xs={4} p={1}>
            <StyledImage src='http://www.fillmurray.com/200/300' />
          </Grid>
          <Grid item xs={4} p={1}>
            <StyledImage src='http://www.fillmurray.com/200/300' />
          </Grid>
          <Grid item xs={4} p={1}>
            <StyledImage src='http://www.fillmurray.com/200/300' />
          </Grid>
        </Grid>
      </Grid>
      <ManagePOAPModal
        isOpen={managePoapModalState.isOpen}
        close={managePoapModalState.close}
        save={async () => {
          managePoapModalState.close();
        }}
      />
    </StyledBox>
  );
}

export default PoapSection;
