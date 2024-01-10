import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Typography } from '@mui/material';

import { BlockNodeContainer } from 'components/common/CharmEditor/components/common/BlockNodeContainer';
import { EmptyEmbed } from 'components/common/CharmEditor/components/common/EmptyEmbed';
import { MediaSelectionPopup } from 'components/common/CharmEditor/components/common/MediaSelectionPopup';
import { FileUploadForm } from 'components/common/CharmEditor/components/file/FileUploadForm';
import type { CharmNodeViewProps } from 'components/common/CharmEditor/components/nodeView/nodeView';
import Link from 'components/common/Link';
import MultiTabs from 'components/common/MultiTabs';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';
import { replaceS3Domain } from 'lib/utilities/url';

export function File({ node, readOnly, selected, deleteNode, updateAttrs }: CharmNodeViewProps) {
  const { src: url, size, name } = node.attrs;

  const onUploadComplete = ({ url: uploadedUrl, fileName, size: fileSize }: UploadedFileInfo) => {
    updateAttrs({ src: uploadedUrl, name: fileName, size: fileSize || null });
  };

  if (!url) {
    if (readOnly) {
      return (
        <EmptyEmbed
          readOnly={readOnly}
          isSelected={selected}
          onDelete={() => {}}
          buttonText='No file uploaded'
          icon={<UploadFileIcon fontSize='small' />}
        />
      );
    } else {
      return (
        <MediaSelectionPopup
          onDelete={deleteNode}
          node={node}
          icon={<UploadFileIcon fontSize='small' />}
          isSelected={selected}
          buttonText='Upload a file'
        >
          <MultiTabs tabs={[['Upload', <FileUploadForm key='upload' onComplete={onUploadComplete} />]]} />
        </MediaSelectionPopup>
      );
    }
  }

  const urlToDisplay = replaceS3Domain(url);

  return (
    <BlockNodeContainer readOnly={readOnly} onDelete={deleteNode} isSelected={selected} sx={{ p: 0 }}>
      <Link href={urlToDisplay} external target='_blank'>
        <Box display='flex' alignItems='center' p={0.75}>
          <UploadFileIcon fontSize='small' color='secondary' sx={{ mr: 1.5 }} />
          <Typography color='secondary' alignItems='center' noWrap>
            {name || urlToDisplay}
          </Typography>
          {size && (
            <Typography color='secondary' alignItems='center' variant='caption' sx={{ ml: 0.5 }}>
              ({(size / 1024).toFixed()}&nbsp;KB)
            </Typography>
          )}
        </Box>
      </Link>
    </BlockNodeContainer>
  );
}
