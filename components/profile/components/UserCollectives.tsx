import EditIcon from '@mui/icons-material/Edit';
import { Chip, Divider, IconButton, Link, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { GetNftsResponse } from 'charmClient/apis/interface';
import Avatar from 'components/common/Avatar';
import { GetPoapsResponse } from 'lib/poap';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { KeyedMutator } from 'swr';
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

function UserCollectiveRow ({ collective }: {collective: Collective}) {

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
      {collective.type === 'poap' ? (
        <Link href={collective.link} target='_blank' display='flex'>
          <Avatar size='large' avatar={collective.image} />
        </Link>
      ) : <Avatar isNft size='large' avatar={collective.image} />}
      <Stack justifyContent='center'>
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
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(collective.date) ?? '?'}</Typography>
      </Stack>
    </Stack>
  );
}

interface UserCollectivesProps extends Pick<UserDetailsProps, 'user'>{
  mutatePoaps: KeyedMutator<GetPoapsResponse>,
  mutateNfts: KeyedMutator<GetNftsResponse>,
  poapData: GetPoapsResponse | undefined
  nftData: GetNftsResponse | undefined
}

export default function UserCollectives ({ user, mutatePoaps, poapData, nftData, mutateNfts }: UserCollectivesProps) {
  const isPublic = isPublicUser(user);
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
            <UserCollectiveRow
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
