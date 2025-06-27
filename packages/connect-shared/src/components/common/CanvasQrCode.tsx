'use client';

import { log } from '@packages/core/log';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';

export function CanvasQRCode({ uri, scale = 4.5 }: { uri: string; scale?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const node = ref.current;

    if (node) {
      QRCode.toCanvas(
        node,
        uri,
        {
          margin: 0,
          scale
        },
        (error) => {
          if (error) log.error('Error generating the QRCode', { error });
        }
      );
    }
  }, [uri, scale]);

  return <canvas ref={ref} />;
}
