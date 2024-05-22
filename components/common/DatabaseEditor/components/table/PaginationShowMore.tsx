import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Typography } from '@mui/material';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import { PageSizeInputPopup } from 'components/PageSizeInputPopup';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useLocalStorage } from 'hooks/useLocalStorage';
import type { usePaginatedData } from 'hooks/usePaginatedData';
import { DEFAULT_PAGE_SIZE } from 'hooks/usePaginatedData';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card, CardWithRelations } from 'lib/databases/card';

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
