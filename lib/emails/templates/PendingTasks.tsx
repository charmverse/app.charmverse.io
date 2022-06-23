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
import { MentionedTask } from 'lib/mentions/interfaces';
import { HR, Feedback, Footer, Header, EmailWrapper } from './components';

type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
const charmverseUrl = process.env.DOMAIN;

export interface PendingTasksProps {
  user: TemplateUser;
  gnosisSafeTasks: GnosisSafeTasks[];
  mentionedTasks: MentionedTask[]
  totalTasks: number
}

export default function PendingTasks (props: PendingTasksProps) {

  return (

    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>Hello {props.user.username}</h3>
            <h2>{props.totalTasks} tasks need your attention.</h2>
          </MjmlText>

          {props.gnosisSafeTasks.map(gnosisSafeTask => <MultisigTask key={gnosisSafeTask.safeAddress} task={gnosisSafeTask} />)}
          {props.mentionedTasks.map(mentionedTask => <MentionTask key={mentionedTask.mentionId} task={mentionedTask} />)}

        </MjmlColumn>
      </MjmlSection>

      <HR />

      <Feedback />

      <Footer />
    </EmailWrapper>
  );
}

function MentionTask ({ task: { pageTitle, spaceName, text, spaceDomain, pagePath, mentionId } }: {task: MentionedTask}) {
  return (
    <>
      <MjmlText>
        <div style={{
          marginBottom: 20
        }}
        >
          <a
            href={`${charmverseUrl}/nexus?task=discussion`}
          >
            <span style={{ fontSize: 24, fontWeight: 'bold' }}>{pageTitle || 'Untitled'}</span>
            <span style={{ fontSize: 20, fontWeight: 'bold' }}>
              ({spaceName})
            </span>
          </a>
        </div>
        <div style={{ fontWeight: 'bold', color: greyColor2 }}>
          {text}
        </div>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='40px' href={`${charmverseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}`}>
        View
      </MjmlButton>
    </>
  );
}

function MultisigTask ({ task }: { task: GnosisSafeTasks }) {
  log.debug('multi sig task', task);
  // console.log('multi sig task...', task.tasks[0].transactions);
  return (
    <>
      <MjmlText>
        <a href={`${charmverseUrl}/nexus?task=multisig`}>
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
