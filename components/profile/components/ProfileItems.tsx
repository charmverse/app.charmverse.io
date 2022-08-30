import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Divider, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Avatar from 'components/common/Avatar';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';

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
      alignItems: 'center',
      opacity: visible ? 1 : 0.25
    }}
    >
      {collective.type === 'poap' ? (
        <Link href={collective.link} target='_blank' display='flex'>
          <Avatar size='large' avatar={collective.image} />
        </Link>
      ) : <Avatar isNft size='large' avatar={collective.image} />}
      <Stack
        justifyContent='center'
        sx={{
          flexGrow: 1
        }}
      >
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
        </Box>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(collective.date) ?? '?'}</Typography>
      </Stack>
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
    </ProfileItemContainer>
  );
}

interface ProfileItemsListProps {
  onVisibilityToggle: (collective: Collective) => void
  isPublic: boolean,
  collectives: Collective[]
}

export function ProfileItemsList ({ collectives, isPublic, onVisibilityToggle }: ProfileItemsListProps) {

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
              onVisibilityToggle(collective);
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
