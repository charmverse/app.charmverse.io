import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useTrackPageView } from 'charmClient/hooks/track';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import Legend from '../Legend';

export const schema = yup.object({});

type FormValues = yup.InferType<typeof schema>;

export function ProposalSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { mappedFeatures } = useSpaceFeatures();

  useTrackPageView({ type: 'settings/proposals' });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  return (
    <Legend sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{mappedFeatures.proposals.title} Settings</Legend>
  );
}
