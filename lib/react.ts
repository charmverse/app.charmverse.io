import { useState, useEffect, useRef, useReducer } from 'react';

/*
this custom hook creates a ref for fn, and updates it on every render.
The new value is always the same fn,
but the fn's context changes on every render

see https://stackoverflow.com/questions/55265255/react-usestate-hook-event-handler-using-initial-state
*/
export const useRefEventListener = (fn: Function) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return fnRef;
};

// https://scastiel.dev/posts/2019-02-19-react-hooks-get-current-state-back-to-the-future/
export function useRefState<T> (initialValue: T) {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  return [state, stateRef, setState] as const;
}

export function useRefLoadingState<T> (initialValue: T) {
  const [state, setState] = useLoadingState<T>(initialValue);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  return [state, stateRef, setState] as const;
}


interface ErrorState {
  error?: string;
}
interface LoadableState extends ErrorState {
  loading: boolean;
}

export function useLoadingState<T> (initialState: Partial<T> & Partial<LoadableState> = {}) {
  return useReducer(
    (state: T & (LoadableState), newState: Partial<T & (LoadableState)>) => ({ ...state, ...newState }),
    { loading: true, ...initialState } as T & LoadableState,
  );
}

interface FormState extends LoadableState {
  saving: boolean;
}

export function useFormState<T> (initialState: Partial<T> & Partial<FormState> = {}) {
  return useReducer(
    (state: T & FormState, newState: Partial<T & FormState>) => ({ ...state, ...newState }),
    { loading: true, saving: false, ...initialState } as T & FormState
  );
}