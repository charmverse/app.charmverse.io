import charmClient from 'charmClient';
import router from 'next/router';
import { FailedImportsError } from 'pages/[domain]/settings/workspace';
import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';

export default function useNotionImport () {
  const [notionFailedImports, setNotionFailedImports] = useState<FailedImportsError[]>([]);
  const [notionImportError, setNotionImportError] = useState<string | null>(null);
  const { showMessage } = useSnackbar();
  const [isImportingFromNotion, setIsImportingFromNotion] = useState(false);
  const { mutate } = useSWRConfig();
  const [space] = useCurrentSpace();

  useEffect(() => {
    if (space && typeof router.query.code === 'string' && router.query.notion === '1') {
      setIsImportingFromNotion(true);
      setNotionFailedImports([]);
      charmClient.importFromNotion({
        code: router.query.code,
        spaceId: space.id
      })
        .then(({ failedImports }) => {
          setIsImportingFromNotion(false);
          mutate(`pages/${space.id}`);
          setNotionFailedImports(failedImports);
          showMessage('Notion workspace successfully imported');
        })
        .catch((err) => {
          setIsImportingFromNotion(false);
          setNotionImportError(err.message ?? err.error ?? 'Something went wrong. Please try again');
        });
    }
  }, [Boolean(space)]);

  return {
    isImportingFromNotion,
    notionFailedImports,
    notionImportError
  };
}
