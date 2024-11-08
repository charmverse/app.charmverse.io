'use client';

import { Stack, Tooltip } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import Image from 'next/image';

export function BonusPartnersDisplay({
  bonusPartners = [],
  size = 20
}: {
  bonusPartners?: BonusPartner[];
  size?: number;
}) {
  if (bonusPartners.length === 0) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='flex-end'>
      {bonusPartners.map((partner) => (
        <Tooltip open key={partner} title={bonusPartnersRecord[partner]?.name}>
          <Image width={size} height={size} src={bonusPartnersRecord[partner]?.icon} alt='' />
        </Tooltip>
      ))}
    </Stack>
  );
}
