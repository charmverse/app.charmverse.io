import { log } from '@packages/core/log';
import { useEffect, useRef } from 'react';

export function MountTracker({
  name,
  children,
  countRenders
}: {
  name: string;
  children: JSX.Element;
  countRenders?: boolean;
}) {
  const renders = useRef(0);

  if (countRenders) {
    renders.current += 1;
    log.debug(`mount debug: ${name} renders: ${renders.current}`);
  }

  useEffect(() => {
    log.debug(`✅ ${name} mounted - mount debug: ${Date.now()}`);

    return () => log.debug(`🔴 ${name} component deleted - mount debug`);
  }, []);

  return children;
}
