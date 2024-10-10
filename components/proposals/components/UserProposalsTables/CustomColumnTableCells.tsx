import { Chip, TableCell, Typography } from '@mui/material';
import type { CustomColumn, UserProposal } from '@root/lib/proposals/getUserProposals';

export function CustomColumnTableCells({
  proposal,
  customColumns
}: {
  proposal: UserProposal;
  customColumns: CustomColumn[];
}) {
  return customColumns.map((column) => {
    const customColumn = proposal.customColumns?.find((_column) => _column.formFieldId === column.formFieldId);
    let value = null;
    if (customColumn) {
      if (column.type === 'select' || column.type === 'multiselect') {
        const option = column.options?.find((_option) => _option.id === customColumn?.value);
        value = option ? <Chip label={option?.name} color={option?.color as any} /> : '-';
      } else {
        value = <Typography>{(customColumn?.value as string) || '-'}</Typography>;
      }
    } else {
      value = '-';
    }

    return (
      <TableCell key={column.formFieldId} align='center' sx={{ minWidth: 100 }}>
        {value}
      </TableCell>
    );
  });
}
