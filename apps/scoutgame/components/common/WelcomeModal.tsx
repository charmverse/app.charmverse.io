'use client';

import { log } from '@charmverse/core/log';
import { Dialog, DialogContent } from '@mui/material';
import { getCookie, setCookie } from '@packages/utils/browser';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { HowItWorksContent } from 'components/welcome/how-it-works/HowItWorksContent';

const pagesToShowOnboarding = ['/home', '/scout', '/profile', '/claim'];

function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const hasSeenModal = getCookie('hasSeenWelcomeModal');
    if (hasSeenModal !== 'true' && pagesToShowOnboarding.some((path) => pathname.startsWith(path))) {
      log.info('Showing welcome modal');
      setIsOpen(true);
    }
  }, []);

  function handleClickContinue(e: React.MouseEvent) {
    e.preventDefault();
    setIsOpen(false);
    setCookie({ name: 'hasSeenWelcomeModal', value: 'true' });
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent sx={{ maxWidth: '500px' }}>
        <HowItWorksContent onClickContinue={handleClickContinue} />
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeModal;
