import { baseUrl } from '@root/config/constants';
import { headers } from 'next/headers';

import { JoinWaitlistHome } from 'components/waitlist/joinWaitlist/JoinWaitlistHome';
import WaitlistGif from 'public/images/waitlist/waitlist-intro.gif';

// async function inboundReq(input: any) {
//   console.log('inboundReq', input);

//   const values: any = {};

//   let hasNext = true;

//   const headerKeys = headers().keys();

//   while (hasNext) {
//     const nextHeader = headerKeys.next().value;

//     headers();

//     if (!nextHeader) {
//       hasNext = false;
//     }

//     console.log('nextHeader', nextHeader);

//     values[nextHeader] = headers().get(nextHeader);
//   }

//   console.log('headers', values);
// }

export default async function WaitlistPage({ params }: { params: { fid: string } }) {
  // const src = 'https://www.gettyimages.fr/gi-resources/images/Embed/new/embed1.jpg';

  return <JoinWaitlistHome referrerFid={params.fid} />;
}
