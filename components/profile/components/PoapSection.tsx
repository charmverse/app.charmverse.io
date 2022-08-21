import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Grid, Link, Stack, SvgIcon, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Button from 'components/common/Button';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { GetPoapsResponse } from 'lib/poap';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userPath]';
import PoapIcon from 'public/images/poap_logo.svg';
import { useContext } from 'react';
import { KeyedMutator } from 'swr';
import { isPublicUser } from './UserDetails';

const StyledBox = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.light};
  border-radius: 5px;
`;

const StyledImage = styled.img`
  width: 100%;
  border-radius: 50%;
`;

type PoapSectionProps = {
  user: PublicUser | LoggedInUser;
  poapData: GetPoapsResponse | undefined
  mutatePoaps: KeyedMutator<GetPoapsResponse>
};

function PoapSection (props: PoapSectionProps) {
  const { user, poapData, mutatePoaps } = props;
  const managePoapModalState = usePopupState({ variant: 'popover', popupId: 'poap-modal' });
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const isPublic = isPublicUser(user);

  const hasConnectedWallet: boolean = !isPublic && user.addresses.length !== 0;

  const poaps = poapData?.visiblePoaps || [];

  return (
    <StyledBox p={2}>
      <Grid container>
        <Grid item xs={8} pl={1}>
          {
            !isPublic && hasConnectedWallet && (
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography fontWeight={700} fontSize={20}>My POAPs</Typography>
              <IconButton onClick={managePoapModalState.open}>
                <EditIcon fontSize='small' data-testid='edit-description' />
              </IconButton>
            </Stack>
            )
          }
          {
            !isPublic && !hasConnectedWallet && <Typography fontWeight={700}>Connect and showcase your POAP collection</Typography>
          }
          {
            isPublic && <Typography fontWeight={700} fontSize={20}>POAPs</Typography>
          }
        </Grid>
        <Grid item container xs={4} justifyContent='space-around'>
          <SvgIcon
            viewBox='0 0 39 51'
            sx={{ width: '55px', height: '77px', marginTop: '-25%' }}
          >
            <PoapIcon />
          </SvgIcon>
        </Grid>
        {
            poaps.length !== 0 && (
            <Grid item container xs={12} py={2}>
              {
                poaps.map(poap => (
                  <Grid item xs={4} p={1} key={poap.tokenId}>
                    <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
                      <StyledImage src={poap.imageURL} />
                    </Link>
                  </Grid>
                ))
              }
            </Grid>
            )
        }
        {
          !poaps.length && (
          <Grid item container xs={12} justifyContent='center' py={2}>
            {
              isPublic && <Typography>There are no POAPs</Typography>
            }
            {
              !isPublic && !hasConnectedWallet && <Button onClick={openWalletSelectorModal}>Connect Wallet</Button>
            }
            {
              !isPublic && hasConnectedWallet && <Typography>You have no POAPs</Typography>
            }
          </Grid>
          )
        }
      </Grid>

    </StyledBox>
  );
}

export default PoapSection;
