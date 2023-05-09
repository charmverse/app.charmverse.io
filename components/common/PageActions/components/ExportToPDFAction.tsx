import { useTheme } from '@emotion/react';
import PrintIcon from '@mui/icons-material/PrintOutlined';
import { ListItemText, ListItemButton } from '@mui/material';
import dynamic from 'next/dynamic';

import { useCharmEditor } from 'hooks/useCharmEditor';

const ReactToPrint = dynamic(() => import('react-to-print'), { loading: PrintButton, ssr: false });

function PrintButton() {
  return (
    <ListItemButton dense>
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

export function ExportToPDFAction({ pdfTitle, onComplete }: { pdfTitle?: string; onComplete: VoidFunction }) {
  const { printRef } = useCharmEditor();
  const theme = useTheme();
  return (
    <ReactToPrint
      onAfterPrint={onComplete}
      trigger={PrintButton}
      content={() => printRef?.current}
      bodyClass={theme.palette.mode === 'dark' ? 'dark-mode' : ''}
      documentTitle={pdfTitle || 'Untitled'}
    />
  );
}
