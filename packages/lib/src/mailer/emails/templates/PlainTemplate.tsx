import { EmailWrapper, Text } from './components';

export function PlainTemplate() {
  return (
    <EmailWrapper title='Please ignore our previous email'>
      <Text>
        Hello from CharmVerse. We apologize about a notification and email we sent earlier that said "The application
        has been appealed and requires your review".
      </Text>
      <Text>This was a mistake we made in testing. There is no application that requires your review. </Text>
    </EmailWrapper>
  );
}

export function emailSubject() {
  return `Please ignore our previous email`;
}
