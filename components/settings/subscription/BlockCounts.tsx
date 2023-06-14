import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

function cleanUtilisationRatio(ratio: number): number {
  if (ratio % 1 === 0) {
    return ratio;
  } else {
    return parseFloat(ratio.toFixed(1));
  }
}

export function BlockCounts() {
  const currentSpace = useCurrentSpace();

  const blockQuota = 1000;

  const { data: blockCount } = useSWR(currentSpace ? `space-block-count-${currentSpace.id}` : null, () =>
    charmClient.spaces.getBlockCount({
      spaceId: currentSpace!.id
    })
  );

  const utilisationRatio = ((blockCount?.count ?? 0) / blockQuota) * 100;

  const usedRatioToFixed = cleanUtilisationRatio(utilisationRatio);

  const unusedRatio = Math.max(0, 100 - usedRatioToFixed);

  const quotaExceeded = usedRatioToFixed >= 100;

  if (!blockCount) {
    return null;
  }

  const usageBarHeight = 5;

  return (
    <Box width='100%'>
      <Box width='90%' margin='auto'>
        <Typography
          variant='caption'
          sx={{ display: 'block', width: '100%', lineHeight: 1.5, whiteSpace: 'break-spaces' }}
        >
          This space has used{' '}
          {`${blockCount.count} blocks of its ${blockQuota} block storage limit (${usedRatioToFixed}%)`}
        </Typography>
        <Box
          sx={{
            width: '100%',
            mt: 1,
            height: usageBarHeight,
            display: 'flex'
          }}
        >
          <Box
            sx={{
              background: quotaExceeded ? 'red' : 'grey',
              width: `${Math.min(100, usedRatioToFixed)}%`,
              height: usageBarHeight
            }}
          />
          <Box
            sx={{
              width: `${unusedRatio}%`,
              height: usageBarHeight,
              background: 'white'
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
