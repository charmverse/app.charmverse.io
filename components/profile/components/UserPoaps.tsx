import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import { Chip, Divider, IconButton, Link, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { GetPoapsResponse } from 'lib/poap';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { ExtendedPoap } from 'models';
import { KeyedMutator } from 'swr';
import ManagePOAPModal from './ManagePOAPModal';
import { isPublicUser, UserDetailsProps } from './UserDetails';

const StyledImage = styled.img`
  width: 100%;
  border-radius: 50%;
`;

function PoapRow ({ poap }: {poap: ExtendedPoap}) {

  return (
    <Stack
      sx={{
        flexDirection: {
          sm: 'row',
          xs: 'column'
        }
      }}
      gap={2}
    >
      <Box
        width={{
          sm: 60,
          xs: 100
        }}
      >
        <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
          <StyledImage src={poap.imageURL} />
        </Link>
      </Box>
      <Stack>
        <Typography
          fontWeight='bold'
          sx={{
            typography: {
              sm: 'h5',
              xs: 'h6'
            }
          }}
        >{poap.name}
        </Typography>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(poap.created) ?? '?'}</Typography>
      </Stack>
    </Stack>
  );
}

export default function UserPoaps ({ user, mutatePoaps, poapData }: Pick<UserDetailsProps, 'user'> & {mutatePoaps: KeyedMutator<GetPoapsResponse>, poapData: GetPoapsResponse | undefined}) {
  const isPublic = isPublicUser(user);
  const managePoapModalState = usePopupState({ variant: 'popover', popupId: 'poap-modal' });
  const poaps: ExtendedPoap[] = [];

  poapData?.hiddenPoaps.forEach(poap => poaps.push(poap as any));
  poapData?.visiblePoaps.forEach(poap => poaps.push(poap as any));
  return (
    <Box>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
        <Stack flexDirection='row' gap={1}>
          <Typography
            fontWeight={500}
            sx={{
              typography: {
                sm: 'h4',
                xs: 'h5'
              }
            }}
          >Poap/NFTs
          </Typography>
          {!isPublic && (
          <IconButton onClick={managePoapModalState.open}>
            <EditIcon data-testid='edit-description' />
          </IconButton>
          )}
        </Stack>
        <Chip label={poaps.length} />
      </Stack>
      <Stack gap={2}>
        {poaps.map(poap => (
          <Box
            key={poap.id}
          >
            <PoapRow
              poap={poap}
            />
            <Divider sx={{
              mt: 2
            }}
            />
          </Box>
        ))}
        {
        !isPublic && poapData && (
        <ManagePOAPModal
          isOpen={managePoapModalState.isOpen}
          close={managePoapModalState.close}
          save={async () => {
            mutatePoaps();
            managePoapModalState.close();
          }}
          visiblePoaps={poapData.visiblePoaps}
          hiddenPoaps={poapData.hiddenPoaps}
        />
        )
      }
      </Stack>
    </Box>
  );
}
