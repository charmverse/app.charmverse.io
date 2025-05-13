import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export function useRouterTransition() {
  const [transitions, setTransitions] = useState<string[]>([]);
  const transitionsRef = useRef(transitions);
  const router = useRouter();

  const addTransition = (url: string) => {
    if (transitionsRef.current.includes(url)) return;

    transitionsRef.current = [...transitionsRef.current, url];
    setTransitions(transitionsRef.current);
  };

  const removeTransition = (url: string) => {
    transitionsRef.current = transitionsRef.current.filter((u) => u !== url);
    setTransitions(transitionsRef.current);
  };

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      addTransition(url);
    };

    const handleRouteChangeComplete = (url: string) => {
      removeTransition(url);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return {
    isTransitioning: transitions.length > 0,
    transitionsRef
  };
}
