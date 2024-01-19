import { log } from '@charmverse/core/log';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';

export function CanvasQRCode({ uri }: { uri: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const node = ref.current;

    if (node) {
      QRCode.toCanvas(node, uri, (error) => {
        if (error) log.error('Error generating the QRCode', { error });
      });
    }
  }, [uri]);

  return <canvas ref={ref} width={220} height={220} />;
}
