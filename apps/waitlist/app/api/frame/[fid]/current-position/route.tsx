import { baseUrl } from '@root/config/constants';
import { ImageResponse } from 'next/og';

import { getTier, tierColors } from 'lib/scoring/constants';

export const runtime = 'edge';
export const contentType = 'image/jpeg';

export async function GET(req: Request) {
  const searchParams = new URLSearchParams(req.url);

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
          backgroundImage: `url(${baseUrl}/images/waitlist/waitlist-current-score.png)`,
          backgroundSize: '600px 600px'
        }}
      >
        <div
          style={{
            top: '120px',
            width: '520px',
            backgroundColor: '#191919',
            color: 'white',
            height: '100px',
            marginLeft: '40px',
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
            <img height='40px' src={`${baseUrl}/images/waitlist/label-${tier}.png`} />
            <span
              style={{
                fontSize: '30px',
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              {percentile}%
            </span>
          </div>
        </div>
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
