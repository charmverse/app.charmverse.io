import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { Button } from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';

export function CreateForumPost({
  onClick,
  disabled,
  disabledTooltip = ''
}: {
  onClick: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
}) {
  const { user } = useUser();

  function clickHandler() {
    if (!disabled) {
      onClick();
    }
  }

  return (
    <Tooltip title={disabled ? disabledTooltip : ''} placement='top-end'>
      <Card variant='outlined' sx={{ mb: '15px' }} onClick={clickHandler}>
        <CardActionArea
          sx={
            !disabled
              ? undefined
              : {
                  color: 'rgba(255, 255, 255, 0)'
                }
          }
        >
          <CardContent>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={1}>
              <UserDisplay userId={user?.id} avatarSize='medium' hideName mr='10px' />
              <TextField
                variant='outlined'
                placeholder='Create Post'
                fullWidth
                sx={{ pointerEvents: 'none' }}
                disabled
              />
              <Button disabled={disabled} component='div' float='right'>
                Create
              </Button>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
}
