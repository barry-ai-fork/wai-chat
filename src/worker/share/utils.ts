export function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit | undefined, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${timeout}s`)), timeout)
    )
  ]);
}
