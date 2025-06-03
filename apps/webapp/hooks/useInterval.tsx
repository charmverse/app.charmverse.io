import { useEffect, useRef } from 'react';

type Callback = (args?: []) => void;

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const useInterval = (callback: Callback, delay: number) => {
  const savedCallback = useRef<Callback | null>(null);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      if (savedCallback && savedCallback.current) {
        savedCallback.current();
      }
    };
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
