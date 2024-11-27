'use client';

import { useEffect } from 'react';

export function LinkInterceptor() {
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest('a');
      const url = anchor?.href;
      if (url) {
        const isExternal = anchor.target === '_blank';

        if (isExternal) {
          event.preventDefault();
          if ('Telegram' in window) {
            (window.Telegram as any).WebApp.openLink(url);
          } else {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      }
    };

    const isTelegram = 'Telegram' in window;
    if (isTelegram) {
      document.addEventListener('click', handleLinkClick);
    }

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return null;
}
