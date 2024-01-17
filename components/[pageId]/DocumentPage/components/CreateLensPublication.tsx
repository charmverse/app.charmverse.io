import { useEffect, useState } from 'react';

import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import type { CreateLensPublicationParams } from 'hooks/useCreateLensPublication';
import { useCreateLensPublication } from 'hooks/useCreateLensPublication';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function CreateLensPublication(
  params: CreateLensPublicationParams & {
    content: PageContent;
  }
) {
  const { createLensPublication } = useCreateLensPublication(params);
  const { setupLensProfile, isAuthenticated } = useLensProfile();
  const [manuallyAuthenticated, setManuallyAuthenticated] = useState(false);

  useEffect(() => {
    async function setup() {
      // If not authenticated we need to authenticate first to get the session,
      // otherwise we can create the lens publication
      if (!isAuthenticated) {
        const authenticated = await setupLensProfile();
        setManuallyAuthenticated(authenticated);
      } else {
        await createLensPublication({
          content: params.content
        });
      }
    }

    setup();

    return () => {
      setManuallyAuthenticated(false);
    };
  }, [params.content, isAuthenticated]);

  // This time the session will be present in the lens hooks
  if (manuallyAuthenticated) {
    return <CreateLensPublication {...params} />;
  }

  return null;
}
