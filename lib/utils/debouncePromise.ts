type AsyncTask = (...args: any) => Promise<any>;

export default function debouncePromise<T extends AsyncTask>(task: T, ms: number): AsyncTask {
  let t: ReturnType<typeof deferred> = {
    cancel: () => null,
    promise: Promise.resolve()
  };
  return async (...args) => {
    try {
      t.cancel();
      t = deferred(ms);
      await t.promise;
      return await task(...args);
    } catch (_) {
      /* prevent memory leak */
    }
  };
}

function deferred(ms: number) {
  let cancel: () => void = () => null;
  const promise = new Promise((resolve, reject) => {
    cancel = reject;
    setTimeout(resolve, ms);
  });
  return { promise, cancel };
}
