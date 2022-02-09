import { useState } from 'react';

function convertToUnixSeconds (timestamp: number | Date): number {

  if (timestamp instanceof Date) {
    timestamp = timestamp.valueOf();
  }

  if (timestamp.toString().length > 10) {
    return timestamp / 1000;
  }
  return timestamp;
}

function timestampDifferenceInSeconds (first: number | Date, second: number | Date): number {
  return Math.floor(convertToUnixSeconds(first) - convertToUnixSeconds(second));
}

export function RelativeTime ({ timestamp }: {timestamp: number}) {

  const [, refreshLabel] = useState('');

  const now = Date.now();

  const differenceInSeconds = timestampDifferenceInSeconds(now, timestamp);

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  let label = '';
  let timeoutToSet = 0;

  switch (true) {
    case (differenceInSeconds < 5):
      label = 'just now';
      timeoutToSet = 1000;
      break;

    case (differenceInSeconds < 60):
      label = `${differenceInSeconds} seconds ago`;
      // Refresh every second
      timeoutToSet = 1000;
      break;

    case (differenceInMinutes === 1):
      label = '1 minute ago';
      // Only refresh once a minute
      timeoutToSet = 60000;
      break;

    default:
      label = `${differenceInMinutes} minutes ago`;
      timeoutToSet = 60000;
  }

  // Refresh this every second
  setTimeout(() => {
    // TODO - Improve this quick hack for forcing re-renders
    refreshLabel(Math.random().toString());
  }, timeoutToSet);

  return (<span>{label}</span>);
}
