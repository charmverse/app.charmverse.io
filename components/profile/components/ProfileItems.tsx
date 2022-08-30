import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Divider, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { NftData } from 'lib/nft/interfaces';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { ExtendedPoap } from 'models';
import { KeyedMutator } from 'swr';

export interface Collective {
  title: string
  date: string
  id: string
  image: string
  type: 'poap' | 'nft'
  link: string
  isHidden: boolean
}

export const ProfileItemContainer = styled(Stack)`
  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    opacity: 0;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  gap: ${({ theme }) => theme.spacing(2)};
  transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
`;

interface ProfileItemProps {
  onClick: () => void,
  visible: boolean,
  showVisibilityIcon: boolean,
  collective: Collective
}

function ProfileItem ({ onClick, collective, visible, showVisibilityIcon }: ProfileItemProps) {
  return (
    <ProfileItemContainer sx={{
      flexDirection: {
        sm: 'column',
        md: 'row'
      },
      opacity: visible ? 1 : 0.25
    }}
    >
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
          {showVisibilityIcon && (
            <IconButton size='small' onClick={onClick}>
              {visible ? (
                <Tooltip title={`Hide ${collective.type.toUpperCase()} from profile`}>
                  <VisibilityIcon className='action' fontSize='small' />
                </Tooltip>
              ) : (
                <Tooltip title={`Show ${collective.type.toUpperCase()} in profile`}>
                  <VisibilityOffIcon className='action' fontSize='small' />
                </Tooltip>
              )}
            </IconButton>
          )}
        </Box>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(collective.date) ?? '?'}</Typography>
      </Stack>
    </ProfileItemContainer>
  );
}

interface ProfileItemsListProps {
  mutateNfts: KeyedMutator<NftData[]>,
  mutatePoaps: KeyedMutator<ExtendedPoap[]>,
  isPublic: boolean,
  collectives: Collective[]
}

export function ProfileItemsList ({ collectives, isPublic, mutateNfts, mutatePoaps }: ProfileItemsListProps) {

  return (
    <Stack gap={2}>
      {collectives.map(collective => (
        <Box
          key={collective.id}
        >
          <ProfileItem
            showVisibilityIcon={!isPublic}
            visible={!collective.isHidden}
            onClick={async () => {
              await charmClient.profile.updateProfileItem({
                profileItems: [{
                  id: collective.id,
                  isHidden: !collective.isHidden,
                  type: collective.type,
                  metadata: null
                }]
              });
              if (collective.type === 'nft') {
                mutateNfts((nftData) => {
                  if (nftData) {
                    return nftData.map(nft => {
                      if (nft.tokenId === collective.id) {
                        return {
                          ...nft,
                          isHidden: !collective.isHidden
                        };
                      }
                      return nft;
                    });
                  }
                  return nftData;
                }, {
                  revalidate: false
                });
              }
              else {
                mutatePoaps((poapData) => {
                  if (poapData) {
                    return poapData.map(poap => {
                      if (poap.tokenId === collective.id) {
                        return {
                          ...poap,
                          isHidden: !collective.isHidden
                        };
                      }
                      return poap;
                    });
                  }
                  return poapData;
                }, {
                  revalidate: false
                });
              }
            }}
            collective={collective}
          />
          <Divider sx={{
            mt: 2
          }}
          />
        </Box>
      ))}
    </Stack>
  );
}
