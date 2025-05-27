import { EmailWrapper, Text } from './components';

export function PlainTemplate({ subject, html }: { subject: string; html: string | string[] }) {
  const htmlArray = Array.isArray(html) ? html : [html];
  return (
    <EmailWrapper title={subject}>
      {htmlArray.map((t) => (
        // use dangerouslySetInnerHTML so that we can pass in HTML (ex: for space data export links)
        <Text key={t} dangerouslySetInnerHTML={{ __html: t }} />
      ))}
    </EmailWrapper>
  );
}
