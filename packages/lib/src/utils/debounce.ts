type Task<T extends unknown[]> = (...args: T) => any;

export default function debounce<T extends unknown[]>(func: Task<T>, delay: number): Task<T> {
  let timer: NodeJS.Timeout | null = null;
  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func.call(null, ...args);
    }, delay);
  };
}
