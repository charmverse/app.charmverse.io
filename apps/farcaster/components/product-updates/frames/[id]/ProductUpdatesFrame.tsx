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
    .split('\n')
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
              fontSize: 24
            }}
          >
            {projectName} Update
          </p>
          <p
            style={{
              fontSize: 20,
              marginTop: -8
            }}
          >
            {createdAtLocal}
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
      <div style={{ width: '100%', height: 2, backgroundColor: 'black' }} />
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
                alignItems: 'flex-start'
              }}
              key={`${index.toString()}`}
            >
              •
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
