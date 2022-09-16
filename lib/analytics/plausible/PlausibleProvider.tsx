import { ReactNode } from 'react';
import Plausible from 'next-plausible';
import { PLAUSIBLE_DOMAIN } from 'lib/analytics/constatnts';

type Props = { children: ReactNode; };

const domain = process.env.NODE_ENV === 'production'
  ? PLAUSIBLE_DOMAIN
  : 'localhost:3000';
const isSetUp = !!PLAUSIBLE_DOMAIN;
const isLocalhost = domain.indexOf('localhost') !== -1;

export default function PlausibleProvider ({ children }: Props) {
  return (
    <Plausible
      domain={domain}
      trackOutboundLinks
      trackFileDownloads
      // For testing purposes - set tracking localhost to true
      enabled={isSetUp && (isLocalhost || undefined)}
      trackLocalhost={isLocalhost}
    >
      {children}
    </Plausible>
  );
}
