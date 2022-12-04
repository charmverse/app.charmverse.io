import { useTheme } from '@emotion/react';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';

export function PostVote({ downvotes, upvotes, upvoted }: { upvoted?: boolean; upvotes: number; downvotes: number }) {
  const theme = useTheme();
  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <NorthIcon
        fontSize='small'
        sx={{
          fill: upvoted === true ? theme.palette.success.main : ''
        }}
      />
      <Typography>{upvotes - downvotes}</Typography>
      <SouthIcon
        fontSize='small'
        sx={{
          fill: upvoted === false ? theme.palette.error.main : ''
        }}
      />
    </Box>
  );
}
