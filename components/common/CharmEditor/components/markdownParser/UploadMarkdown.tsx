import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFilePicker } from 'hooks/useFilePicker';
import { usePages } from 'hooks/usePages';
import type { PagesMap } from 'lib/pages';

export function UploadZippedMarkdown() {
  const space = useCurrentSpace();
  const { mutatePagesList } = usePages();

  const { inputRef, onFileChange, openFilePicker } = useFilePicker((file) => {
    charmClient.file
      .uploadZippedMarkdown({
        spaceId: space!.id,
        file
      })
      .then((pages) => {
        const pageMap = pages.reduce((acc, page) => {
          acc[page.id] = page;
          return acc;
        }, {} as PagesMap);
        mutatePagesList(pageMap);
      });
  });

  return (
    <>
      <Button size='snall' secondary onClick={openFilePicker}>
        {inputRef.current?.files?.[0]?.name ?? 'Select file'}
      </Button>
      <input ref={inputRef} hidden onChange={onFileChange} accept='.zip' id='file' name='file' type='file' />;
    </>
  );
}
