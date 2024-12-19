import env from '@beam-australia/react-env';
import * as React from 'react';

import type { TelegramAccount } from 'lib/telegram/interfaces';

export const TELEGRAM_BOT_ID = env('TELEGRAM_BOT_ID');

export function loginWithTelegram(callback: (user: TelegramAccount) => void) {
  // @ts-ignore - defined by the script: https://telegram.org/js/telegram-widget.js
  window.Telegram.Login.auth({ bot_id: TELEGRAM_BOT_ID, request_access: true }, callback);
}

export function TelegramLoginIframe() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    ref.current?.appendChild(script);
  }, []);

  return <div ref={ref} />;
}
