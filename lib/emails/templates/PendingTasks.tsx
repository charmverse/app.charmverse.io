import {
  MjmlSection,
  MjmlColumn,
  MjmlText
} from 'mjml-react';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import EmailWrapper from './components/EmailWrapper';
import Footer from './components/Footer';

export interface PendingTasksProps {
  tasks: GnosisSafeTasks[];
}

export default function PendingTasks (props: PendingTasksProps) {
  return (

    <EmailWrapper title='Your current tasks'>
      <MjmlSection borderTop='2px solid #eee' paddingTop={0}>
        <MjmlColumn>

          <MjmlText paddingBottom={0}>
            <h2>Current Tasks</h2>
            <p>You have {props.tasks.length} tasks</p>

          </MjmlText>

          <Footer />
        </MjmlColumn>
      </MjmlSection>
    </EmailWrapper>
  );
}
