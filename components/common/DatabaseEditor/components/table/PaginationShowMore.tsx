import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Typography } from '@mui/material';

import { PageSizeInputPopup } from 'components/PageSizeInputPopup';
import type { usePaginatedData } from 'hooks/usePaginatedData';

type PaginationProps = ReturnType<typeof usePaginatedData>;

export function PaginationShowMore({
  pageSize,
  setPageSize,
  hasNextPage,
  showNextPage
}: { hasNextPage: boolean; showNextPage: VoidFunction } & Pick<PaginationProps, 'pageSize' | 'setPageSize'>) {
  if (!hasNextPage) {
    return null;
  }
  return (
    <div className='octo-table-footer'>
      <div className='octo-table-cell' onClick={showNextPage}>
        <Box display='flex' gap={1} alignItems='center'>
          <ArrowDownwardIcon fontSize='small' />
          <Typography fontSize='small'>Load more</Typography>
          <PageSizeInputPopup onChange={setPageSize} pageSize={pageSize} />
        </Box>
      </div>
    </div>
  );
}
