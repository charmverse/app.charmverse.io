import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Typography } from '@mui/material';
import { useMemo } from 'react';

import { BlockNodeContainer } from 'components/common/CharmEditor/components/common/BlockNodeContainer';
import { EmptyEmbed } from 'components/common/CharmEditor/components/common/EmptyEmbed';
import { MediaSelectionPopup } from 'components/common/CharmEditor/components/common/MediaSelectionPopup';
import { FileUploadForm } from 'components/common/CharmEditor/components/file/FileUploadForm';
import type { CharmNodeViewProps } from 'components/common/CharmEditor/components/nodeView/nodeView';
import Link from 'components/common/Link';
import MultiTabs from 'components/common/MultiTabs';

export function File({ node, readOnly, selected, deleteNode, updateAttrs }: CharmNodeViewProps) {
  const url: string = useMemo(() => node.attrs.src, [node.attrs.src]);

  const onUploadComplete = (uploadedUrl: string) => {
    updateAttrs({ src: uploadedUrl });
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
          {url}
        </Typography>
      </BlockNodeContainer>
    </Link>
  );
}
