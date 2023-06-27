import { useEffect, useRef, useState } from 'react';

const windowParams = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=500,height=650,left=50%,top=50%`;

export function usePopupLogin<T>() {
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const onSuccessRef = useRef<(data: T) => void>();

  useEffect(() => {
    if (popupWindow) {
      // This is to bypass same domain policy
      const intervalId = setInterval(() => {
        popupWindow.postMessage('test', '*'); // Replace * with origin

        if (popupWindow.closed) {
          setPopupWindow(null);
          onSuccessRef.current = undefined;
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [popupWindow]);

  useEffect(() => {
    if (popupWindow) {
      // listen to message from popup window
      const listener = (event: MessageEvent<{ success: boolean } & T>) => {
        const { data } = event;

        if (data.success) {
          setPopupWindow(null);
          popupWindow.close();

          onSuccessRef.current?.(data);
          onSuccessRef.current = undefined;
        }
      };

      window.addEventListener('message', listener);

      return () => window.removeEventListener('message', listener);
    }
  }, [popupWindow]);

  const openPopupLogin = (url: string, onSuccess: (data: T) => void) => {
    if (typeof window !== 'undefined') {
      onSuccessRef.current = onSuccess;
      const popup = window.open(url, 'Login to CharmVerse', windowParams);

      setPopupWindow(popup);
    }
  };

  return {
    openPopupLogin
  };
}
