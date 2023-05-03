import { useTheme } from '@emotion/react';
import PrintIcon from '@mui/icons-material/PrintOutlined';
import { ListItemText, ListItemButton } from '@mui/material';
import { useReactToPrint } from 'react-to-print';

import { useCharmEditor } from 'hooks/useCharmEditor';

export function ExportToPDFMarkdown({ pdfTitle }: { pdfTitle?: string }) {
  const { printRef } = useCharmEditor();
  const theme = useTheme();
  const handlePrint = useReactToPrint({
    content: () => printRef?.current,
    bodyClass: theme.palette.mode === 'dark' ? 'dark-mode' : '',
    documentTitle: pdfTitle || 'Untitled'
  });
  return (
    <ListItemButton onClick={handlePrint}>
      <PrintIcon
        fontSize='small'
        sx={{
          mr: 1
        }}
      />
      <ListItemText primary='Export to PDF' />
    </ListItemButton>
  );
}
