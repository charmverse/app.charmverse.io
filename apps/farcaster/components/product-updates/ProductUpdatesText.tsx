export function ProductUpdatesText({
  text,
  createdAtLocal,
  projectName
}: {
  projectName: string;
  text: string;
  createdAtLocal: string;
}) {
  const lines = text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(0, 10);

  return (
    <div
      style={{
        padding: 10,
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <p style={{ fontSize: 20 }}>{projectName}</p>
      <p style={{ fontSize: 18 }}>{createdAtLocal}</p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {lines.map((line, index) => {
          const numberReplacedLine = line.replace(/^\d+\.\s/, '');
          return (
            <p
              style={{
                wordBreak: 'break-word',
                marginTop: 10
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
