import type { Space } from '@prisma/client';

import { useUser } from 'hooks/useUser';

type Props = {
  onSuccess: (values: Space) => void;
  spaceDomain: string;
  joinButtonLabel?: string;
};

export function DiscordGate({ onSuccess, spaceDomain, joinButtonLabel }: Props) {
  const { user } = useUser();

  return null;
}
