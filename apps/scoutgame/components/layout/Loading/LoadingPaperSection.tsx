import type { SkeletonProps } from '@mui/material';
import { Skeleton } from '@mui/material';

export function LoadingPaperSection(props: SkeletonProps) {
  return (
    <>
      <Skeleton animation='wave' variant='rounded' width={80} height={25} sx={{ my: 1 }} />
      <Skeleton animation='wave' variant='rounded' width='100%' height={70} {...props} />
    </>
  );
}
