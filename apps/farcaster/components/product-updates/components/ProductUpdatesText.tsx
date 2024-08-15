import { baseUrl } from '@root/config/constants';

export function ProductUpdatesText({
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
        paddingBottom: 10,
        paddingTop: 10,
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
            {projectName}
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
        <img width={100} height={100} src={projectAvatarImage || `${baseUrl}/images/default-project-avatar.webp`} />
      </div>
      <div style={{ width: '100%', height: 2, backgroundColor: 'black' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 15
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
                  wordBreak: 'break-word',
                  marginTop: -2,
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
