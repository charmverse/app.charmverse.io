import { baseUrl } from '@packages/config/constants';

import { DIVIDER } from 'lib/productUpdates/schema';

export function ProductUpdatesFrame({
  text,
  createdAtLocal,
  projectName,
  projectAvatarImage
}: {
  projectName: string;
  text: string;
  createdAtLocal: string;
  projectAvatarImage: string | null;
}) {
  const lines = text
    .split(DIVIDER)
    .filter((line) => line.trim().length)
    .slice(0, 10);

  return (
    <div
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        lineHeight: '18px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <p
            style={{
              fontSize: 24,
              fontFamily: 'Inter',
              fontWeight: 700,
              maxWidth: 350,
              marginBottom: '.5em',
              marginTop: 0
            }}
          >
            {projectName}
          </p>
          <p
            style={{
              fontSize: 16,
              marginBottom: 0,
              marginTop: 0
            }}
          >
            Product Update &ndash; {createdAtLocal}
          </p>
        </div>
        <div style={{ display: 'flex', paddingRight: 20 }}>
          <img
            width={100}
            height={100}
            style={{
              objectFit: 'contain',
              marginTop: 10,
              marginBottom: 10
            }}
            src={projectAvatarImage || `${baseUrl}/images/default-project-avatar.png`}
          />
        </div>
      </div>
      <div style={{ width: '100%', height: 1, margin: '0', backgroundColor: '#aaa' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '1.5em'
        }}
      >
        {lines.map((line, index) => {
          const numberReplacedLine = line.replace(/^\d+\.\s/, '');
          return (
            <div
              style={{
                gap: 4,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                whiteSpace: 'pre-wrap',
                width: '100%'
              }}
              key={`${index.toString()}`}
            >
              <span
                style={{
                  fontSize: '3em',
                  lineHeight: '.4em',
                  marginRight: 8
                }}
              >
                &middot;
              </span>
              <p
                style={{
                  fontSize: 18,
                  wordBreak: 'break-word',
                  marginTop: -4,
                  lineHeight: 1.5
                }}
              >
                {numberReplacedLine}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
