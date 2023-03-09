import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useMemo } from 'react';

import { EmptyEmbed } from 'components/common/CharmEditor/components/common/EmptyEmbed';
import { MediaSelectionPopup } from 'components/common/CharmEditor/components/common/MediaSelectionPopup';
import { FileUploadForm } from 'components/common/CharmEditor/components/file/FileUploadForm';
import type { CharmNodeViewProps } from 'components/common/CharmEditor/components/nodeView/nodeView';
import MultiTabs from 'components/common/MultiTabs';

export function File({ node, readOnly, selected, deleteNode }: CharmNodeViewProps) {
  const url: string = useMemo(() => node.attrs.src, [node.attrs.src]);

  const onUploadComplete = (uploadedUrl: string) => {
    // add file url to node
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

  return <div>file</div>;
}
