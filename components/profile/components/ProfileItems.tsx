import EditIcon from '@mui/icons-material/Edit';
import { Chip, Divider, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { GetNftsResponse } from 'lib/nft/interfaces';
import { GetPoapsResponse } from 'lib/poap';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWRImmutable from 'swr/immutable';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import styled from '@emotion/styled';
import ManageProfileItemModal from './ManageProfileItemModal';
import { isPublicUser, UserDetailsProps } from './UserDetails';

interface Collective {
  title: string
  date: string
  id: string
  image: string
  type: 'poap' | 'nft'
  link: string
}

const StyledStack = styled(Stack)`
  flex-direction: ${({ theme }) => theme.breakpoints.down('sm') ? 'row' : 'column'};
  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    opacity: 0;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  gap: ${({ theme }) => theme.spacing(2)};
`;

function ProfileItem ({ collective }: {collective: Collective}) {
  return (
    <StyledStack>
      {collective.type === 'poap' ? (
        <Link href={collective.link} target='_blank' display='flex'>
          <Avatar size='large' avatar={collective.image} />
        </Link>
      ) : <Avatar isNft size='large' avatar={collective.image} />}
      <Stack justifyContent='center'>
        <Box
          display='flex'
          gap={1}
          alignItems='center'
        >
          <Typography
            fontWeight='bold'
            sx={{
              fontSize: {
                sm: '1.15rem',
                xs: '1.05rem'
              }
            }}
          >{collective.title}
          </Typography>
          <IconButton size='small'>
            <Tooltip title={`Hide ${collective.type.toUpperCase()} from profile`}>
              <VisibilityOffIcon className='action' fontSize='small' />
            </Tooltip>
          </IconButton>
        </Box>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(collective.date) ?? '?'}</Typography>
      </Stack>
    </StyledStack>
  );
}

export default function ProfileItems ({ user }: Pick<UserDetailsProps, 'user'>) {
  const isPublic = isPublicUser(user);
  const { data: poapData, mutate: mutatePoaps } = useSWRImmutable(`/poaps/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve({ visiblePoaps: user.visiblePoaps, hiddenPoaps: [] } as GetPoapsResponse)
      : charmClient.getUserPoaps();
  });

  const { data: nftData, mutate: mutateNfts } = useSWRImmutable(`/nfts/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve({ visibleNfts: user.visibleNfts, hiddenNfts: [] } as GetNftsResponse)
      : charmClient.nft.list(user.id);
  });
  const managePoapModalState = usePopupState({ variant: 'popover', popupId: 'poap-modal' });

  const collectives: Collective[] = [];

  const hiddenPoaps = poapData?.hiddenPoaps ?? [];
  const visiblePoaps = poapData?.visiblePoaps ?? [];
  const visibleNfts = nftData?.visibleNfts ?? [];
  const hiddenNfts = nftData?.hiddenNfts ?? [];

  [...hiddenPoaps, ...visiblePoaps].forEach(poap => {
    collectives.push({
      type: 'poap',
      date: poap.created as string,
      id: poap.tokenId,
      image: poap.imageURL,
      title: poap.name,
      link: `https://app.poap.xyz/token/${poap.tokenId}`
    });
  });

  [...visibleNfts, ...hiddenNfts].forEach(nft => {
    collectives.push({
      type: 'nft',
      date: nft.timeLastUpdated,
      id: nft.tokenId,
      image: nft.image ?? nft.imageThumb,
      title: nft.title,
      link: ''
    });
  });

  collectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1);

  return collectives.length !== 0 ? (
    <Box>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography
            sx={{
              typography: {
                sm: 'h1',
                xs: 'h2'
              }
            }}
          >NFTs & Poaps
          </Typography>
          {!isPublic && (
            <IconButton onClick={managePoapModalState.open}>
              <EditIcon data-testid='edit-description' />
            </IconButton>
          )}
        </Stack>
        <Chip label={collectives.length} />
      </Stack>
      <Stack gap={2}>
        {collectives.map(collective => (
          <Box
            key={collective.id}
          >
            <ProfileItem
              collective={collective}
            />
            <Divider sx={{
              mt: 2
            }}
            />
          </Box>
        ))}
        {
        !isPublic && poapData && (
          <ManageProfileItemModal
            isOpen={managePoapModalState.isOpen}
            close={managePoapModalState.close}
            save={async () => {
              mutatePoaps();
              mutateNfts();
              managePoapModalState.close();
            }}
            hiddenNfts={hiddenNfts}
            visibleNfts={visibleNfts}
            visiblePoaps={visiblePoaps}
            hiddenPoaps={hiddenPoaps}
          />
        )
      }
      </Stack>
    </Box>
  ) : null;
}
