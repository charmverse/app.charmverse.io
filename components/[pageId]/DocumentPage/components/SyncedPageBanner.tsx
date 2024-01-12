import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box } from '@mui/material';

import { AlertBanner } from 'components/common/Banners/Alert';
import Link from 'components/common/Link';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export function SyncedPageBanner({ pageId, source }: { pageId: string | null; source: 'proposals' | 'rewards' }) {
  const { getFeatureTitle } = useSpaceFeatures();
  const documentName = source === 'proposals' ? getFeatureTitle('Proposal') : getFeatureTitle('Reward');
  return (
    <AlertBanner icon={false} severity='info'>
      <Box display='flex' alignItems='center' gap={0.5}>
        The content of this page is copied from a{' '}
        <Link target='_blank' href={`/${pageId}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {documentName}
          <LaunchIcon sx={{ fontSize: 14 }} />
        </Link>
      </Box>
    </AlertBanner>
  );
}
