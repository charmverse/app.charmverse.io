import { useRouter } from 'next/router';
import { useEffect } from 'react';

import type { PathProps } from 'hooks/useSettingsDialog';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import log from 'lib/log';

export default function NexusRedirect() {
  const { onClick } = useSettingsDialog();
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      log.info('Show tasks to user', router.asPath, router.query.task);
      router.push('/');
      onClick('notifications', { taskType: router.query.task } as PathProps);
    }
  }, [router.isReady]);

  return null;
}
