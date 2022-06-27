import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
import { ReactNode, useState } from 'react';

interface PdfSelectorProps {
  autoOpen?: boolean;
  onPdfSelect: (pdfSrc: string) => void
  children: ReactNode
}

export default function PdfSelector ({ autoOpen = false, children, onPdfSelect }: PdfSelectorProps) {
  const [embedLink, setEmbedLink] = useState('');
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
            ],
            [
              'Link',
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                alignItems: 'center'
              }}
              >
                <TextField autoFocus placeholder='Paste the PDF link...' value={embedLink} onChange={(e) => setEmbedLink(e.target.value)} />
                <Button
                  disabled={!embedLink}
                  sx={{
                    width: 250
                  }}
                  onClick={() => {
                    onPdfSelect(embedLink);
                    setEmbedLink('');
                  }}
                >
                  Embed PDF
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
