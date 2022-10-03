import { useEffect } from 'react';

import type { Block } from '../blocks/block';
import type { WSClient } from '../wsclient';
import wsClient from '../wsclient';

export default function useCardListener (onChange: (blocks: Block[]) => void, onReconnect: () => void): void {
  useEffect(() => {
    const onChangeHandler = (_: WSClient, blocks: Block[]) => onChange(blocks);
    wsClient.addOnChange(onChangeHandler);
    wsClient.addOnReconnect(onReconnect);
    return () => {
      wsClient.removeOnChange(onChangeHandler);
      wsClient.removeOnReconnect(onReconnect);
    };
  }, []);
}
