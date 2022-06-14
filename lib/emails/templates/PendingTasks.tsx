import {
  MjmlSection,
  MjmlColumn,
  MjmlText,
  MjmlButton
} from 'mjml-react';
import { User } from '@prisma/client';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { shortenHex } from 'lib/utilities/strings';
import { greyColor2 } from 'theme/colors';
import log from 'lib/log';
import { HR, Feedback, Footer, Header, EmailWrapper } from './components';

type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };

export interface PendingTasksProps {
  user: TemplateUser;
  tasks: GnosisSafeTasks[];
}

export default function PendingTasks (props: PendingTasksProps) {

  return (

    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h1>Hello {props.user.username},<br />Your signature is required</h1>
          </MjmlText>

          {props.tasks.map(task => <MultisigTask key={task.safeAddress} task={task} />)}

        </MjmlColumn>
      </MjmlSection>

      <HR />

      <Feedback />

      <Footer />
    </EmailWrapper>
  );
}

function MultisigTask ({ task }: { task: GnosisSafeTasks }) {

  const charmUrl = 'https://app.charmverse.io/nexus';
  log.debug('multi sig task', task);
  // console.log('multi sig task...', task.tasks[0].transactions);
  return (
    <>
      <MjmlText>
        <a href={charmUrl}>
          <h2>Multi sig transaction</h2>
        </a>
        <strong style={{ color: greyColor2 }}>
          Safe address: {shortenHex(task.safeAddress)}<br />
          {task.tasks[0].transactions[0].description}
        </strong>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='40px' href={task.tasks[0].transactions[0].myActionUrl}>
        {task.tasks[0].transactions[0].myAction}
      </MjmlButton>
    </>
  );
}
