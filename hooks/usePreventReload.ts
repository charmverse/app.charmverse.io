import { useEffect } from 'react';

export function usePreventReload(isDirty: boolean) {
  const warningText = 'You have unsaved changes. Please confirm changes.';
  // prompt the user if they try and leave with unsaved changes
  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      (e || window.event).returnValue = warningText;
      return warningText;
    };
    window.addEventListener('beforeunload', handleWindowClose);
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
    };
  }, [isDirty]);
}
