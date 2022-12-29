import { useEffect, useRef } from 'react';
import { TbChevronsUpLeft } from 'react-icons/tb';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFilePicker } from 'hooks/useFilePicker';
import current from 'pages/api/spaces/current';

export function UploadZippedMarkdown() {
  const space = useCurrentSpace();

  const formRef = useRef<HTMLFormElement | null>(null);
  const { onFileChange } = useFilePicker((file) => {
    charmClient.file.uploadZippedMarkdown({
      spaceId: space!.id,
      file
    });
  });

  return (
    <>
      <input onChange={onFileChange} accept='.zip' id='file' name='file' type='file' />;
    </>
  );
}
