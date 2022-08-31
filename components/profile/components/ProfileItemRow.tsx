import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
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

interface ProfileItemProps {
  onClick: () => void,
  visible: boolean,
  showVisibilityIcon: boolean,
  collective: Collective
}

export const ProfileItemContainer = styled(Stack)<{ visible: boolean }>`

  opacity: ${({ visible }) => (visible ? 1 : 0.25)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding-bottom: ${({ theme }) => theme.spacing(2)};

  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
`;

export default function ProfileItemRow ({ onClick, collective, visible, showVisibilityIcon }: ProfileItemProps) {
  return (
    <ProfileItemContainer
      visible={visible}
      display='flex'
      gap={2}
      flexDirection='row'
    >
      {collective.type === 'poap' ? (
        <Link href={collective.link} target='_blank' display='flex'>
          <Avatar size='large' avatar={collective.image} />
        </Link>
      ) : <Avatar isNft size='large' avatar={collective.image} />}
      <Stack
        justifyContent='center'
        flexGrow={1}
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
        <IconButton
          size='small'
          className='action'
          sx={{
            opacity: {
              md: 0,
              sm: 1
            }
          }}
          onClick={onClick}
        >
          {visible ? (
            <Tooltip title={`Hide ${collective.type.toUpperCase()} from profile`}>
              <VisibilityIcon fontSize='small' />
            </Tooltip>
          ) : (
            <Tooltip title={`Show ${collective.type.toUpperCase()} in profile`}>
              <VisibilityOffIcon fontSize='small' />
            </Tooltip>
          )}
        </IconButton>
      )}
    </ProfileItemContainer>
  );
}
