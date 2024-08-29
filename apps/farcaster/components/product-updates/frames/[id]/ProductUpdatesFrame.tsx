import { baseUrl } from '@root/config/constants';

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
    .split('__$__')
    .filter((line) => line.trim().length)
    .slice(0, 10);

  return (
    <div
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 8,
        paddingTop: 8,
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        width: '100%',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 8
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
              fontWeight: 700
            }}
          >
            {projectName}
          </p>
          <p
            style={{
              fontSize: 16,
              marginTop: -8
            }}
          >
            Product Update &ndash; {createdAtLocal}
          </p>
        </div>
        <img
          width={85}
          height={85}
          style={{
            objectFit: 'contain'
          }}
          src={projectAvatarImage || `${baseUrl}/images/default-project-avatar.png`}
        />
      </div>
      <div style={{ width: '100%', height: 1, backgroundColor: '#aaa' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 10
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
