// My file: /my-project/src/pages/api/myimage/[code].jsx
// !!! Important is in: .../api/...

import { GET as httpGET } from '@root/adapters/http';
import { baseUrl } from '@root/config/constants';
import { ImageResponse } from 'next/og';
import React from 'react';

import { getTier } from 'lib/scoring/constants';
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

  const percentile = searchParams.get('percentile');

  const tier = getTier(parseInt(percentile || '1'));

  const font = await fetch(`${baseUrl}/inter/static/Inter_18pt-Medium.ttf`).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '600px',
          height: '600px',
          // background: 'blue',
          fontFamily: 'Inter',
          backgroundImage: `url(${baseUrl}/images/waitlist/dev/waitlist-current-score.jpg)`,
          backgroundSize: '600px 600px'
        }}
      >
        <div
          style={{
            top: '100px',
            width: '560px',
            backgroundColor: '#191919',
            color: 'white',
            height: '100px',
            marginLeft: '20px',
            marginRight: '20px',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            borderRadius: '10px'
          }}
        >
          <span style={{ marginLeft: 'auto', marginRight: 'auto', fontSize: '22px', marginTop: '10px' }}>
            Your Current Tier & Percentile
          </span>
          <div
            style={{
              display: 'flex',
              textAlign: 'center',
              justifyContent: 'space-between',
              paddingLeft: '20px',
              paddingRight: '20px',
              marginTop: '10px',
              width: '100%'
            }}
          >
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>{tier.toUpperCase()}</span>
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>{percentile}%</span>
          </div>
        </div>
        <h1>Example 3</h1>
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
