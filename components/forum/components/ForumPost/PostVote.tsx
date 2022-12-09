import { useTheme } from '@emotion/react';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';

export function PostVote({
  downvotes,
  upvotes,
  upvoted,
  votePost
}: {
  upvoted?: boolean;
  upvotes: number;
  downvotes: number;
  votePost: (upvoted?: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <NorthIcon
        fontSize='small'
        sx={{
          fill: upvoted === true ? theme.palette.success.main : ''
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          votePost(upvoted === undefined || upvoted === false ? true : undefined);
        }}
      />
      <Typography>{upvotes - downvotes}</Typography>
      <SouthIcon
        fontSize='small'
        sx={{
          fill: upvoted === false ? theme.palette.error.main : ''
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          votePost(upvoted === undefined || upvoted === true ? false : undefined);
        }}
      />
    </Box>
  );
}
