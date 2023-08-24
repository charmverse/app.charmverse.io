import { Box, Card, Menu, Paper } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';
import { PageLink } from 'components/common/PageLayout/components/PageNavigation/components/PageTreeItem';
import { Typography } from 'components/common/Typography';

export default {
  title: 'common/Popups',
  component: Typography
};

export function EmojiPicker() {
  const popupState = usePopupState({ variant: 'popover', popupId: `emoji-picker` });

  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' flexDirection='column' gap={4}>
        <Typography variant='h5'>Popup content:</Typography>
        <Card variant='outlined' sx={{ maxWidth: 350 }}>
          <CustomEmojiPicker onUpdate={() => {}} />
        </Card>
        <Typography variant='h5'>Popup example:</Typography>
        <Card sx={{ p: 2 }} variant='outlined'>
          <Button color='secondary' variant='outlined' {...bindTrigger(popupState)}>
            Show popup
          </Button>
          <Menu
            {...bindMenu(popupState)}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <CustomEmojiPicker onUpdate={() => {}} />
          </Menu>
        </Card>
      </Box>
    </Paper>
  );
}
