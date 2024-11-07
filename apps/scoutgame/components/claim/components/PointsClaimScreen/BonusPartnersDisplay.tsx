'use client';

import { Stack } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import Image from 'next/image';

export function BonusPartnersDisplay({ bonusPartners, size = 20 }: { bonusPartners?: BonusPartner[]; size?: number }) {
  const bonusPartnerIcons = (bonusPartners ?? [])
    .filter((partner) => !!bonusPartnersRecord[partner])
    .map((partner) => bonusPartnersRecord[partner].icon);

  if (bonusPartnerIcons.length === 0) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='flex-end'>
      {bonusPartnerIcons.map((partnerIcon) => (
        <Image key={partnerIcon} width={size} height={size} src={partnerIcon} alt='Bonus partner' />
      ))}
    </Stack>
  );
}
