'use client';

import { useEffect } from 'react';

export function LinkInterceptor() {
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest('a');

      if (anchor && anchor.href) {
        const url = new URL(anchor.href);

        const isExternal = url.origin !== window.location.origin;

        if (isExternal) {
          event.preventDefault();
          if ('Telegram' in window) {
            (window.Telegram as any).WebApp.openLink(url);
          } else {
            window.open(url.href, '_blank', 'noopener,noreferrer');
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return null;
}
