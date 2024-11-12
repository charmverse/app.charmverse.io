import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import React from 'react';

import { primaryTextColorDarkMode, secondaryText } from 'theme/colors';

export function PointsClaimScoutScreen({
  claimedPoints,
  displayName,
  builders,
  baseUrl = ''
}: {
  baseUrl?: string;
  displayName: string;
  claimedPoints: number;
  builders: { avatar: string | null; displayName: string }[];
}) {
  const currentWeek = getCurrentSeasonWeekNumber();

  return (
    <div
      style={{
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '75%',
        height: '75%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
        marginTop: '32px',
        color: primaryTextColorDarkMode
      }}
      className='scoutgame-claim-screen'
    >
      <h1
        style={{
          fontFamily: 'K2D',
          fontSize: '2.125rem',
          margin: 0
        }}
      >
        TOP SCOUT
      </h1>

      <h2
        style={{
          color: secondaryText,
          fontWeight: 600,
          fontSize: '1.25rem',
          marginTop: '16px'
        }}
      >
        {displayName}
      </h2>

      <div
        style={{
          fontSize: '1.25rem',
          textAlign: 'center'
        }}
      >
        scored {claimedPoints} Scout Points <br /> in week {currentWeek} of
      </div>

      <div
        style={{
          fontWeight: 'bold',
          fontSize: '1.25rem',
          textAlign: 'center',
          fontFamily: 'Posterama'
        }}
      >
        SCOUT GAME!
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '16px',
          paddingLeft: '32px'
        }}
      >
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: 0
            }}
          >
            My Top Builders:
          </h2>

          {builders.map((builder) => (
            <div
              key={builder.displayName}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <img
                src={builder.avatar ?? ''}
                alt={builder.displayName}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%'
                }}
              />
              <span style={{ fontWeight: 600 }}>{builder.displayName}</span>
            </div>
          ))}
        </div>

        <img src={`${baseUrl}/images/profile/builder-dog.png`} alt='Builder Dog' width={200} height={200} />
      </div>
    </div>
  );
}
