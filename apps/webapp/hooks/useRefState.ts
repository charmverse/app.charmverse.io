import { useEffect, useRef, useState } from 'react';

// https://scastiel.dev/posts/2019-02-19-react-hooks-get-current-state-back-to-the-future/
export default function useRefState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  return [state, stateRef, setState] as const;
}
