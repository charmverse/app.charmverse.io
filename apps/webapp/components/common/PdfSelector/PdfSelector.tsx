import { log } from '@charmverse/core/log';
import { Box } from '@mui/material';
import { useState, type ReactNode } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { uploadToS3 } from '@packages/lib/aws/uploadToS3Browser';

import { selectorPopupSizeConfig } from '../CharmEditor/components/common/selectorPopupSizeConfig';

interface PdfSelectorProps {
  autoOpen?: boolean;
  onPdfSelect: (pdfSrc: string) => void;
  children: ReactNode;
}

export default function PdfSelector({ autoOpen = false, children, onPdfSelect }: PdfSelectorProps) {
  const tabs: [string, ReactNode][] = [];
  const [isUploading, setIsUploading] = useState(false);

  return (
    <PopperPopup
      autoOpen={autoOpen}
      paperSx={selectorPopupSizeConfig}
      popupContent={
        <Box>
          <MultiTabs
            tabs={[
              ...tabs,
              [
                'Upload',
                <Box
                  key='upload'
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  <Button component='label' variant='contained' loading={isUploading}>
                    Choose a PDF
                    <input
                      type='file'
                      hidden
                      accept='application/pdf'
                      onChange={async (e) => {
                        const firstFile = e.target.files?.[0];
                        if (firstFile) {
                          try {
                            setIsUploading(true);
                            const { url } = await uploadToS3(charmClient.uploadToS3, firstFile);
                            onPdfSelect(url);
                          } catch (error) {
                            log.error('Failed to upload PDF', { error });
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }}
                    />
                  </Button>
                </Box>
              ]
            ]}
          />
        </Box>
      }
    >
      {children}
    </PopperPopup>
  );
}
