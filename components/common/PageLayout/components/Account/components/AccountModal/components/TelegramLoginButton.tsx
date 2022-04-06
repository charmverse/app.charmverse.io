import { TelegramAccount } from 'pages/api/telegram/connect';
import * as React from 'react';

interface Props {
  botName: string,
  buttonSize?: 'large' | 'medium' | 'small',
  cornerRadius?: number,
  requestAccess?: string,
  usePic?: boolean
  lang?: string
  dataOnauth: (telegramAccount: TelegramAccount) => void
  dataAuthUrl?: string
  widgetVersion?: number
  className?: string
}

// https://github.com/hprobotic/react-telegram-login/blob/master/src/index.js

export class TelegramLoginButton extends React.Component<Props> {
  instance: HTMLDivElement | null = null;

  componentDidMount () {
    const {
      botName,
      buttonSize = 'medium',
      cornerRadius,
      requestAccess = 'write',
      usePic = true,
      dataOnauth,
      dataAuthUrl,
      lang = 'en',
      widgetVersion
    } = this.props;
    (window as any).TelegramLoginWidget = {
      dataOnauth: (user: TelegramAccount) => dataOnauth(user)
    };

    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?${widgetVersion}`;
    script.async = true;
    this.instance?.appendChild(script);
  }

  render () {
    return (
      <div
        className={this.props.className}
        ref={(component) => {
          this.instance = component;
        }}
      >
        {this.props.children}
      </div>
    );
  }
}
