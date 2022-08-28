import { useEffect } from 'react';

import { Block } from '../blocks/block';
import wsClient, { WSClient } from '../wsclient';

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
