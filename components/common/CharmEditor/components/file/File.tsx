import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Typography } from '@mui/material';

import { BlockNodeContainer } from 'components/common/CharmEditor/components/common/BlockNodeContainer';
import { EmptyEmbed } from 'components/common/CharmEditor/components/common/EmptyEmbed';
import { MediaSelectionPopup } from 'components/common/CharmEditor/components/common/MediaSelectionPopup';
import { FileUploadForm } from 'components/common/CharmEditor/components/file/FileUploadForm';
import type { CharmNodeViewProps } from 'components/common/CharmEditor/components/nodeView/nodeView';
import Link from 'components/common/Link';
import MultiTabs from 'components/common/MultiTabs';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';

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

  return (
    <Link href={url} external target='_blank'>
      <BlockNodeContainer readOnly={readOnly} onDelete={deleteNode} isSelected={selected}>
        <UploadFileIcon fontSize='small' color='secondary' sx={{ mr: 1.5 }} />
        <Typography color='secondary' alignItems='center' noWrap>
          {name || url}
        </Typography>
        {size && (
          <Typography color='secondary' alignItems='center' variant='caption' sx={{ ml: 0.5 }}>
            ({(size / 1024).toFixed()}&nbsp;KB)
          </Typography>
        )}
      </BlockNodeContainer>
    </Link>
  );
}
