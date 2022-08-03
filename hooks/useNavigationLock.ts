import { useRouter } from 'next/router';
import { useEffect } from 'react';

// https://gist.github.com/Tymek/df2021b77fcea20cabaef46bbee8b001
// Next.js issue: https://github.com/vercel/next.js/issues/2694
// Next.js discussion: https://github.com/vercel/next.js/discussions/12348
export function useNavigationLock (isDirty: boolean, onConfirm: () => void) {
  const router = useRouter();
  const warningText = 'You have unsaved changes. Please confirm changes.';
  // prompt the user if they try and leave with unsaved changes
  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      (e || window.event).returnValue = warningText;
      return warningText;
    };
    const handleBrowseAway = () => {
      if (!isDirty) return;
      if (window.confirm(warningText)) {
        onConfirm();
      }
    };
    window.addEventListener('beforeunload', handleWindowClose);
    router.events.on('routeChangeStart', handleBrowseAway);
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
      router.events.off('routeChangeStart', handleBrowseAway);
    };
  }, [isDirty]);
}
