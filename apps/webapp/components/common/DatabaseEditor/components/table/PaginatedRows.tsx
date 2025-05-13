import { usePaginatedData } from 'hooks/usePaginatedData';

import { PaginationShowMore } from './PaginationShowMore';

// perhaps we can replace tableRows.tsx with this component eventually, built for table groups
export function PaginatedRows<T>({
  rows,
  pageSize,
  children
}: {
  rows: T[];
  pageSize?: number;
  children: (row: T) => JSX.Element;
}) {
  const props = usePaginatedData(rows, { pageSize });
  return (
    <>
      {props.data.map((row, i) => children(row as T))}
      <PaginationShowMore {...props} />
    </>
  );
}
