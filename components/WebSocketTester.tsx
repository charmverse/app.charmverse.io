import Grid from '@mui/material/Grid';
import { useState } from 'react';

import { PimpedButton as Button } from 'components/common/Button';
import { useWebSocketClient } from 'hooks/useSocketClient';

export function WebSocketTester () {

  // Testing area

  const { messageLog, sendMessage } = useWebSocketClient();

  // --------------------
  return (
    <Grid container width='100%' flexDirection='row' height='300px' style={{ overflowY: 'auto' }}>
      <Grid item xs={12}>
        Web socket connection test ({messageLog.length})

        <Button onClick={() => sendMessage({ content: 'Here is the update' })}>Send ping</Button>
      </Grid>
      {
      messageLog.map((message, index) => (
        <Grid item xs={12}>
          <p>{message.type}: {typeof message === 'object' ? JSON.stringify(message) : message}</p>
        </Grid>
      ))
    }
    </Grid>
  );
}

