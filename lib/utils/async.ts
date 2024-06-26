// A utilitiy to recursively call and endpoint with paginated results
export async function paginatedCall<R, Q = object | null>(
  // The first method should call an API and return the result directly
  fn: (reqBody: Q) => Promise<R>,
  // The second method should return an object w/the next page token, or null if we should stop
  getNextQuery: (response: R) => Q
) {
  let query = null as Q;
  const results: R[] = [];
  do {
    const res = await fn(query);
    results.push(res);
    query = getNextQuery(res);
  } while (query);
  return results;
}

export async function delay(ms: number = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
