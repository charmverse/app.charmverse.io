import Grid from '@mui/material/Grid';

import { Button } from 'components/common/Button';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

export function WebSocketTester() {
  // Testing area

  const { messageLog, clearLog, sendMessage } = useWebSocketClient();

  // --------------------
  return (
    <Grid container width='100%' flexDirection='row' height='300px' style={{ overflowY: 'auto' }}>
      <Grid size={12} spacing={2}>
        Web socket connection test ({messageLog.length})
        <Button onClick={() => sendMessage({ type: 'ping', content: 'Here is the update' } as any)}>Send ping</Button>
        <Button css={{ backgroundColor: 'red' }} onClick={clearLog}>
          Clear
        </Button>
      </Grid>
      {messageLog.map((message) => {
        const msgString = typeof message === 'object' ? JSON.stringify(message) : message;
        return (
          <Grid key={msgString} size={12}>
            <p>{msgString}</p>
          </Grid>
        );
      })}
    </Grid>
  );
}
