import { RefObject, useEffect } from "react";

export function useWatchClickOutside(
  ref: RefObject<HTMLDivElement>,
  onClickOutside?: () => void,
  onClickInside?: () => void,
) {
  useEffect(() => {
    const handler = (e: any) => {
      if (!ref.current) {
        return;
      }

      let inside =
        typeof e.composedPath === 'function'
          ? e.composedPath().includes(ref.current)
          : ref.current.contains(e.target);

      if (inside) {
        onClickInside?.();
        return;
      }
      onClickOutside?.();
      return;
    };
    document.addEventListener('click', handler);
    return () => {
      document.removeEventListener('click', handler);
    };
  }, [ref, onClickOutside, onClickInside]);
}