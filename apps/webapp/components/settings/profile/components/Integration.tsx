import type { IdentityType } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { Box, Chip, Divider, IconButton, Menu, Stack, Tooltip, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';

type IntegrationProps = {
  isInUse: boolean;
  icon: ReactNode;
  action?: ReactNode;
  menuActions?: ReactNode[];
  identityType: IdentityType;
  name: string;
  username: string;
  // Used for showing email for Google accounts, and wallet address for shortened wallet names or ens names
  secondaryUserName?: string;
  selectIntegration: (id: string, type: IdentityType) => void;
};

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()}
`;

function Integration(props: IntegrationProps) {
  const {
    isInUse,
    icon,
    action,
    menuActions = [],
    username,
    name,
    identityType,
    selectIntegration,
    secondaryUserName
  } = props;
  const identityMenuState = usePopupState({ variant: 'popover', popupId: `identity-menu-${identityType}` });
  const hasActionsMenu = menuActions && menuActions.length !== 0;

  return (
    <StyledStack>
      <Stack
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        gap={0.5}
        justifyContent='space-between'
        width='100%'
        alignItems='center'
      >
        <Box
          width={{
            xs: '100%',
            md: '50%'
          }}
        >
          <Tooltip title={secondaryUserName}>
            <Typography
              component='span'
              fontSize={{
                xs: '1em',
                md: '1.15em'
              }}
              fontWeight={700}
            >
              {username}
              {action}
            </Typography>
          </Tooltip>
        </Box>

        <Stack
          flexDirection='row'
          width={{
            xs: '100%',
            md: '50%'
          }}
          justifyContent='space-between'
        >
          <Chip
            variant='outlined'
            size='medium'
            label={
              <Stack gap={0.75} alignItems='center' flexDirection='row'>
                {icon}
                <Typography variant='subtitle1'>{name}</Typography>
              </Stack>
            }
            sx={{
              width: 'fit-content'
            }}
          />
          <Stack gap={0.5} flexDirection='row' alignItems='center'>
            {isInUse ? (
              <Stack flexDirection='row' mr={!hasActionsMenu ? 4.5 : 0}>
                <CheckIcon fontSize='small' />
                <Typography ml={1} variant='body2'>
                  Selected
                </Typography>
              </Stack>
            ) : (
              <Button
                size='small'
                color='secondary'
                variant='outlined'
                onClick={() => selectIntegration(username, identityType)}
                sx={{
                  mr: !hasActionsMenu
                    ? {
                        xs: 4.25,
                        md: 4.5
                      }
                    : 0
                }}
              >
                Select
              </Button>
            )}

            {hasActionsMenu && (
              <IconButton
                size='small'
                className='icons'
                aria-label={`Open ${identityType.toLowerCase()} identity options`}
                {...bindTrigger(identityMenuState)}
              >
                <MoreHoriz fontSize='small' />
              </IconButton>
            )}
          </Stack>

          <Menu
            {...bindMenu(identityMenuState)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            onClick={identityMenuState.close}
          >
            {menuActions}
          </Menu>
        </Stack>
      </Stack>
      <Divider
        sx={{
          my: 1.5
        }}
      />
    </StyledStack>
  );
}

export default Integration;
