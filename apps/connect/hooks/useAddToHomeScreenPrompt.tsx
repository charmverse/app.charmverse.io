import { log } from '@charmverse/core/log';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function useAddToHomescreenPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  const promptToInstall = async () => {
    if (prompt) {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setPrompt(null);
      }
      log.info(`User ${choiceResult.outcome} the installation prompt on ${choiceResult.platform}`);
    } else {
      log.debug('Tried installing before browser sent "beforeinstallprompt" event');
    }
  };

  useEffect(() => {
    const ready = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', ready);

    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
    };
  }, []);

  useEffect(() => {
    const onInstall = () => {
      setIsPwaInstalled(true);
    };

    window.addEventListener('appinstalled', onInstall);

    return () => {
      window.removeEventListener('appinstalled', onInstall);
    };
  }, []);

  return { prompt, promptToInstall, isPwaInstalled };
}
