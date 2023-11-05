import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export function LoadingSubscriptionSkeleton({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) {
    return null;
  }

  return (
    <Stack gap={1} mt={2}>
      <Skeleton variant='rectangular' width={150} height={16} />
      <Skeleton variant='rectangular' width='100%' height={55} />
      <Skeleton variant='rectangular' width={150} height={16} sx={{ mt: 1 }} />
      <Skeleton variant='rectangular' width='100%' height={35} />
    </Stack>
  );
}
