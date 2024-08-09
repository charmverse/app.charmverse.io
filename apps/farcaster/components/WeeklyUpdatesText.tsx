export function WeeklyUpdatesText({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(0, 10);

  return (
    // Tried with ol but it was not working
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        wordBreak: 'break-all'
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: 20 }}>Weekly updates: {new Date().toLocaleDateString()}</p>
      {lines.map((line, index) => {
        const hasNumberAtStart = /^\d+\.\s/.test(line);
        return <p key={`${index.toString()}`}>{hasNumberAtStart ? line : `${index + 1}. ${line}`}</p>;
      })}
    </div>
  );
}
