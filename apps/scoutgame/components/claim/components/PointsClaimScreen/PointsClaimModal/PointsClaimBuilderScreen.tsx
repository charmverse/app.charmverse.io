import { getCurrentSeasonWeekNumber } from '@packages/scoutgame/dates';
import { baseUrl } from '@root/config/constants';
import React from 'react';

import { primaryTextColorDarkMode, secondaryText } from 'theme/colors';

export function PointsClaimBuilderScreen({
  claimedPoints,
  displayName,
  repos
}: {
  displayName: string;
  claimedPoints: number;
  repos: string[];
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
        TOP BUILDER
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

      <img src={`${baseUrl}/images/diamond.png`} alt='Diamond' width={100} height={100} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100%',
          padding: '0 16px',
          marginTop: '8px'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            margin: 0
          }}
        >
          Contributions:
        </h2>

        {repos.map((repo) => (
          <div
            key={repo}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {repo}
          </div>
        ))}
      </div>
    </div>
  );
}
