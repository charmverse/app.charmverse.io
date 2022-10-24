import Grid from '@mui/material/Grid';
import { useState } from 'react';

import { PimpedButton as Button } from 'components/common/Button';
import { useWebSocketClient } from 'hooks/useSocketClient';

export function WebSocketTester () {

  // Testing area

  const { messageLog, clearLog, sendMessage } = useWebSocketClient();

  // --------------------
  return (
    <Grid container width='100%' flexDirection='row' height='300px' style={{ overflowY: 'auto' }}>
      <Grid item xs={12} spacing={2}>
        Web socket connection test ({messageLog.length})

        <Button onClick={() => sendMessage({ type: 'ping', content: 'Here is the update' } as any)}>Send ping</Button>
        <Button css={{ backgroundColor: 'red' }} onClick={clearLog}>Clear</Button>
      </Grid>
      {
      messageLog.map((message, index) => (
        <Grid item xs={12}>
          <p>{typeof message === 'object' ? JSON.stringify(message) : message}</p>
        </Grid>
      ))
    }
    </Grid>
  );
}

