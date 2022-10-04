import { createNanoEvents } from 'nanoevents';
import React, { useState, useEffect } from 'react';

export type FlashMessage = {
    content: React.ReactNode;
    severity: 'low' | 'normal' | 'high';
}

const emitter = createNanoEvents();

export function sendFlashMessage (message: FlashMessage): void {
  emitter.emit('message', message);
}

type Props = {
    milliseconds: number;
}

export const FlashMessages = React.memo((props: Props) => {
  const [message, setMessage] = useState<FlashMessage|null>();
  const [fadeOut, setFadeOut] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>|null>(null);

  const handleTimeout = (): void => {
    setMessage(null);
    setFadeOut(false);
  };

  const handleFadeOut = (): void => {
    setFadeOut(true);
    setTimeoutId(setTimeout(handleTimeout, 200));
  };

  useEffect(() => {
    let isSubscribed = true;
    emitter.on('message', (newMessage: FlashMessage) => {
      if (isSubscribed) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        setTimeoutId(setTimeout(handleFadeOut, props.milliseconds - 200));
        setMessage(newMessage);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleClick = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    handleFadeOut();
  };

  if (!message) {
    return null;
  }

  return (
    <div
      className={`FlashMessages ${message.severity}${fadeOut ? ' flashOut' : ' flashIn'}`}
      onClick={handleClick}
    >
      {message.content}
    </div>
  );
});
