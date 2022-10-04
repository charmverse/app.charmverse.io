import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';

import Avatar from 'components/common/Avatar';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';

export interface Collectable {
  title: string;
  date: string;
  id: string;
  image: string;
  type: 'poap' | 'nft';
  link: string;
  isHidden: boolean;
}

interface ProfileItemProps {
  onClick: () => void;
  visible: boolean;
  showVisibilityIcon: boolean;
  collectable: Collectable;
}

export const ProfileItemContainer = styled(({ visible, ...props }: any) => <Stack {...props} />)<{ visible: boolean }>`

  .hidden-on-visible {
    opacity: ${({ visible }) => (visible ? 1 : 0.25)};
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding-bottom: ${({ theme }) => theme.spacing(2)};

  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

`;

export default function CollectibleRow ({ onClick, collectable, visible, showVisibilityIcon }: ProfileItemProps) {
  return (
    <ProfileItemContainer
      visible={visible}
      display='flex'
      gap={2}
      flexDirection='row'
    >
      <Link className='hidden-on-visible' href={collectable.link} target='_blank' display='flex'>
        <Avatar size='large' isNft={collectable.type === 'nft'} avatar={collectable.image} />
      </Link>
      <Stack
        className='hidden-on-visible'
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
          >{collectable.title}
          </Typography>
        </Box>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(collectable.date) ?? '?'}</Typography>
      </Stack>
      {showVisibilityIcon && (
        <Box display='flex' alignItems='center'>
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
              <Tooltip title={`Hide ${collectable.type.toUpperCase()} from profile`}>
                <VisibilityIcon fontSize='small' />
              </Tooltip>
            ) : (
              <Tooltip title={`Show ${collectable.type.toUpperCase()} in profile`}>
                <VisibilityOffIcon fontSize='small' />
              </Tooltip>
            )}
          </IconButton>
        </Box>
      )}
    </ProfileItemContainer>
  );
}
