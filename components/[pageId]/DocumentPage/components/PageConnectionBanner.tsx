import { AlertBanner } from 'components/common/Banners/Alert';

export function PageConnectionBanner() {
  return (
    <AlertBanner severity='error'>
      Can’t establish a connection to the server. New data WILL NOT be saved. Please refresh the page
    </AlertBanner>
  );
}
