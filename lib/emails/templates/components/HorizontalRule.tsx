import {
  MjmlSection,
  MjmlColumn,
  MjmlDivider
} from 'mjml-react';

export default function HorizontalRule () {
  return (
    <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
      <MjmlColumn>
        <MjmlDivider />
      </MjmlColumn>
    </MjmlSection>
  );
}
