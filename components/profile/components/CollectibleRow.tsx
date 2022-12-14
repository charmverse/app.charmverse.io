import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Card, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';

import Avatar from 'components/common/Avatar';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';

const StyledAvatar = styled(Avatar)`
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  &:hover {
    z-index: 10000;
    background-color: #fff;
    -ms-transform: scale(1.5);
    -moz-transform: scale(1.5);
    -webkit-transform: scale(1.5);
    -o-transform: scale(1.5);
    transform: scale(1.5);
    transition: all 1s;
  }
`;
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
export function CollectibleCollection({ onClick, collectable, visible, showVisibilityIcon }: ProfileItemProps) {
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
export function CollectibleIndividual({ onClick, collectable, visible, showVisibilityIcon }: ProfileItemProps) {
  return (
    <StyledCard sx={{ p: 3 }}>
      <ProfileItemContainer visible={visible} gap={2}>
        <Link className='hidden-on-visible' href={collectable.link} target='_blank'>
          <StyledAvatar sx={{ width: 75, height: 75 }} isNft={collectable.type === 'nft'} avatar={collectable.image} />
        </Link>
        <Stack className='hidden-on-visible'>
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
    </StyledCard>
  );
}
