import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import { ListItemText, ListItemButton } from '@mui/material';
import { useReactToPrint } from 'react-to-print';

import { useCharmEditor } from 'hooks/useCharmEditor';

export function ExportToPDFMarkdown({ pdfTitle }: { pdfTitle?: string }) {
  const { printRef } = useCharmEditor();

  const handlePrint = useReactToPrint({
    content: () => printRef?.current,
    documentTitle: pdfTitle || 'Untitled'
  });
  return (
    <ListItemButton onClick={handlePrint}>
      <GetAppOutlinedIcon
        fontSize='small'
        sx={{
          mr: 1
        }}
      />
      <ListItemText primary='Export to PDF' />
    </ListItemButton>
  );
}
