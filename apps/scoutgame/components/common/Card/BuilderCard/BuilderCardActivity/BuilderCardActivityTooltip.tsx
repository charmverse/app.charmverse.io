import { Stack, Typography } from '@mui/material';

import { GemsIcon } from 'components/common/Icons';

export function BuilderCardActivityTooltip() {
  return (
    <Stack flexDirection='column' gap={0.5} py={1} width='fit-content'>
      <Stack flexDirection='row' gap={2} justifyContent='space-between' alignItems='center'>
        <Stack width={50} alignItems='center'>
          <Stack
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'text.secondary'
            }}
          />
        </Stack>
        <Stack flexDirection='row' gap={0.5} flex={1} alignItems='center'>
          <Typography>= Scored 30+ </Typography>
          <GemsIcon size={16} />
        </Stack>
      </Stack>
      <Stack flexDirection='row' gap={2} justifyContent='space-between' alignItems='center'>
        <Stack width={50} alignItems='center'>
          <Stack
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 'text.secondary'
            }}
          />
        </Stack>
        <Stack flexDirection='row' gap={0.5} flex={1} alignItems='center'>
          <Typography>= Scored 1 to 29 </Typography>
          <GemsIcon size={16} />
        </Stack>
      </Stack>
      <Stack flexDirection='row' gap={2} justifyContent='space-between' alignItems='center'>
        <Stack width={50} alignItems='center'>
          <Stack
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: 'text.secondary'
            }}
          />
        </Stack>
        <Stack flexDirection='row' gap={0.5} flex={1} alignItems='center'>
          <Typography>= No activity </Typography>
        </Stack>
      </Stack>
      <Stack flexDirection='row' gap={2} justifyContent='space-between' alignItems='center'>
        <Stack width={50} alignItems='center'>
          <Typography color='text.secondary'>Empty</Typography>
        </Stack>
        <Stack flexDirection='row' gap={0.5} flex={1} alignItems='center'>
          <Typography>= No data </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
