// My file: /my-project/src/pages/api/myimage/[code].jsx
// !!! Important is in: .../api/...

import { GET as httpGET } from '@root/adapters/http';
import { baseUrl } from '@root/config/constants';
import { ImageResponse } from 'next/og';
import React from 'react';

import YourScoreImage from 'public/images/waitlist/dev/waitlist-current-score.jpg';

export const runtime = 'edge';
export const contentType = 'image/jpeg';

export async function GET(req: Request) {
  let data;

  const searchParams = new URLSearchParams(req.url);

  // Font
  // const interSemiBold = fetch(
  //   new URL('./Inter-SemiBold.ttf', import.meta.url)
  // ).then((res) => res.arrayBuffer());

  const font = await fetch(`${baseUrl}/inter/static/Inter_18pt-Medium.ttf`).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '600px',
          height: '600px',
          // background: 'blue',
          fontFamily: 'Inter',
          backgroundImage: `url(${baseUrl}/images/waitlist/dev/waitlist-current-score.jpg)`,
          backgroundSize: '600px 600px'
        }}
      >
        <h1>Example</h1>
      </div>
    ),
    // ImageResponse options
    {
      width: 600,
      height: 600,
      fonts: [
        {
          name: 'Inter',
          data: font,
          style: 'normal',
          weight: 400
        }
      ]
    }
  );
}
