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
    .filter((line) => line.trim() !== '')
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
          alignItems: 'flex-start'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {projectAvatarImage && <img width={35} height={35} src={projectAvatarImage} />}
          <p>{projectName}</p>
          <p
            style={{
              marginTop: -8
            }}
          >
            {createdAtLocal}
          </p>
        </div>
        <img width={100} height={100} src='https://cdn.pixabay.com/photo/2023/01/31/04/11/rocket-7757105_1280.png' />
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
            <p
              style={{
                wordBreak: 'break-word',
                marginTop: -4
              }}
              key={`${index.toString()}`}
            >
              • {numberReplacedLine}
            </p>
          );
        })}
      </div>
    </div>
  );
}
