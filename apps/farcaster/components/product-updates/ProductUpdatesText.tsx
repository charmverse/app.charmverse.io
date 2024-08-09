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
    <ol
      style={{
        padding: 10,
        gap: 0,
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        wordBreak: 'break-all',
        listStyleType: 'disc'
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: 20 }}>{projectName}</p>
      <p style={{ fontWeight: 500, fontSize: 18 }}>{createdAtLocal}</p>
      {lines.map((line, index) => {
        const hasNumberAtStart = /^\d+\.\s/.test(line);
        return <li key={`${index.toString()}`}>{hasNumberAtStart ? line : `${index + 1}. ${line}`}</li>;
      })}
    </ol>
  );
}
