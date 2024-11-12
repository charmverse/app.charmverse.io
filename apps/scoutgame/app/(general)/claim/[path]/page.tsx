import { getCurrentWeek } from '@packages/scoutgame/dates';
import { appEnv } from '@root/config/constants';
import { notFound } from 'next/navigation';

import { getUserByPath } from 'lib/users/getUserByPath';

export default async function Claim({ params }: { params: { path: string } }) {
  const user = await getUserByPath(params.path);
  if (!user) {
    return notFound();
  }

  const region = process.env.S3_UPLOAD_REGION;
  const bucket = process.env.SCOUTGAME_S3_BUCKET;
  const claimScreenUrl = `https://s3.${region}.amazonaws.com/${bucket}/claim-screens/${appEnv}/${user.id}/${getCurrentWeek()}.png`;

  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='fc:frame:image' content={claimScreenUrl} />
      <meta property='fc:frame:image:aspect_ratio' content='1:1' />

      <meta name='fc:frame:button:1' content='My profile' />
      <meta name='fc:frame:button:1:action' content='link' />
      <meta name='fc:frame:button:1:target' content={`${process.env.DOMAIN}/u/${params.path}`} />

      <meta name='fc:frame:button:2' content='Play now' />
      <meta name='fc:frame:button:2:action' content='link' />
      <meta name='fc:frame:button:2:target' content={process.env.DOMAIN} />
    </>
  );
}
