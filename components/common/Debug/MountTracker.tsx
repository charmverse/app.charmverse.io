import { useEffect } from 'react';

import log from 'lib/log';

export function MountTracker ({ name, children }: { name: string, children: JSX.Element }) {
  useEffect(() => {
    log.debug(`✅ ${name} mounted - mount debug: ${Date.now()}`);

    return () => log.debug(`🗑️ ${name} component deleted - mount debug`);
  }, []);

  return children;
}
