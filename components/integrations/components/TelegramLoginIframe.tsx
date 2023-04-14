import * as React from 'react';

import type { TelegramAccount } from 'pages/api/telegram/connect';

export const TELEGRAM_BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;

export function loginWithTelegram(callback: (user: TelegramAccount) => void) {
  // @ts-ignore - defined by the script: https://telegram.org/js/telegram-widget.js
  window.Telegram.Login.auth({ bot_id: TELEGRAM_BOT_ID, request_access: true }, callback);
}

export class TelegramLoginIframe extends React.Component<{
  widgetVersion?: string;
  children?: React.ReactNode;
}> {
  instance: HTMLDivElement | null = null;

  componentDidMount() {
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?${this.props.widgetVersion || ''}`;
    script.async = true;
    this.instance?.appendChild(script);
  }

  render() {
    return (
      <div
        style={{
          cursor: 'pointer',
          opacity: 0,
          pointerEvents: 'none',
          position: 'absolute',
          width: 0,
          height: 0
        }}
        ref={(component) => {
          this.instance = component;
        }}
      >
        {this.props.children}
      </div>
    );
  }
}
