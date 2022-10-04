import { Button } from '@mui/material';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

interface PdfSelectorProps {
  autoOpen?: boolean;
  onPdfSelect: (pdfSrc: string) => void;
  children: ReactNode;
}

export default function PdfSelector ({ autoOpen = false, children, onPdfSelect }: PdfSelectorProps) {
  const tabs: [string, ReactNode][] = [];

  return (
    <PopperPopup
      autoOpen={autoOpen}
      popupContent={(
        <Box sx={{
          width: 750
        }}
        >
          <MultiTabs tabs={[
            ...tabs,
            [
              'Upload',
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%'
              }}
              >
                <Button component='label' variant='contained'>
                  Choose a PDF
                  <input
                    type='file'
                    hidden
                    accept='application/pdf'
                    onChange={async (e) => {
                      const firstFile = e.target.files?.[0];
                      if (firstFile) {
                        const { url } = await uploadToS3(firstFile);
                        onPdfSelect(url);
                      }
                    }}
                  />
                </Button>
              </Box>
            ]
          ]}
          />
        </Box>
      )}
    >
      {children}
    </PopperPopup>
  );
}
