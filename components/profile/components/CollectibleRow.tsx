import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Card, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';

import Avatar from 'components/common/Avatar';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';

export interface Collectable {
  contract?: string;
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

  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }
`;
export default function CollectibleRow({ onClick, collectable, visible, showVisibilityIcon }: ProfileItemProps) {
  return (
    <Card sx={{ p: 4 }}>
      <ProfileItemContainer visible={visible} display='flex' gap={2} flexDirection='column' alignItems='center'>
        <Link className='hidden-on-visible' href={collectable.link} target='_blank'>
          <Avatar sx={{ width: 200, height: 200 }} isNft={collectable.type === 'nft'} avatar={collectable.image} />
        </Link>
        <Stack className='hidden-on-visible' textAlign='center'>
          <Typography fontWeight='bold' fontSize='xs'>
            {collectable.title}
          </Typography>
          <Typography variant='subtitle2'>{showDateWithMonthAndYear(collectable.date) ?? '?'}</Typography>
        </Stack>
        {showVisibilityIcon && (
          <Box>
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
    </Card>
  );
}
