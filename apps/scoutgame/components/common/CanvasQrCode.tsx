'use client';

import { log } from '@charmverse/core/log';
import { styled } from '@mui/material';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';

const StyledCanvas = styled('canvas')`
  border: 6px solid white;
  box-sizing: content-box;
`;
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
          scale,
          width: 200
        },
        (error) => {
          if (error) log.error('Error generating the QRCode', { error });
        }
      );
    }
  }, [uri, scale]);

  return <StyledCanvas ref={ref} />;
}
