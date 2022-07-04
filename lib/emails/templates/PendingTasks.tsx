import {
  MjmlSection,
  MjmlColumn,
  MjmlText,
  MjmlButton,
  MjmlDivider
} from 'mjml-react';
import { User } from '@prisma/client';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { shortenHex } from 'lib/utilities/strings';
import { darkModeColors, greyColor2 } from 'theme/colors';
import log from 'lib/log';
import { MentionedTask } from 'lib/mentions/interfaces';
import { VoteTask } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import { HR, Feedback, Footer, Header, EmailWrapper } from './components';

type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
const charmverseUrl = process.env.DOMAIN;

export interface PendingTasksProps {
  user: TemplateUser;
  gnosisSafeTasks: GnosisSafeTasks[];
  mentionedTasks: MentionedTask[]
  totalTasks: number
  voteTasks: VoteTask[]
}

export default function PendingTasks (props: PendingTasksProps) {

  const totalMentionTasks = props.mentionedTasks.length;
  const totalVoteTasks = props.voteTasks.length;
  const totalGnosisSafeTasks = props.gnosisSafeTasks.length;

  const mentionSection = totalMentionTasks > 0 ? (
    <>
      <MjmlText>
        <a
          href={`${charmverseUrl}/nexus?task=discussion`}
        >
          <h2 style={{ marginBottom: 0 }}>{totalMentionTasks} Mention{totalMentionTasks > 1 ? 's' : ''}</h2>
        </a>

      </MjmlText>
      {props.mentionedTasks.map(mentionedTask => (
        <MentionTask
          key={mentionedTask.mentionId}
          task={mentionedTask}
        />
      ))}
    </>
  ) : null;

  const voteSection = totalVoteTasks > 0 ? (
    <>
      <MjmlText>
        <a
          href={`${charmverseUrl}/nexus?task=vote`}
        >
          <h2 style={{ marginBottom: 0 }}>{totalVoteTasks} Vote{totalVoteTasks > 1 ? 's' : ''}</h2>
        </a>

      </MjmlText>
      {props.voteTasks.map(voteTask => (
        <VoteTaskMjml
          key={voteTask.id}
          task={voteTask}
        />
      ))}
      <MjmlDivider />
    </>
  ) : null;

  const multisigSection = totalGnosisSafeTasks > 0 ? (
    <>
      <MjmlText>
        <a href={`${charmverseUrl}/nexus?task=multisig`}>
          <h2 style={{ marginBottom: 0 }}>{totalGnosisSafeTasks} Multisig transaction{totalGnosisSafeTasks > 1 ? 's' : ''}</h2>
        </a>
      </MjmlText>
      {props.gnosisSafeTasks.map(gnosisSafeTask => <MultisigTask key={gnosisSafeTask.safeAddress} task={gnosisSafeTask} />)}
      <MjmlDivider />
    </>
  ) : null;

  return (

    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>Hello {props.user.username}</h3>
            <h2>{props.totalTasks} tasks need your attention.</h2>
          </MjmlText>

          {multisigSection}
          {voteSection}
          {mentionSection}

        </MjmlColumn>
      </MjmlSection>

      <HR />

      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

function VoteTaskMjml ({ task }: {task: VoteTask}) {
  const voteTaskLink = `${charmverseUrl}/${task.space.domain}/${task.page.path}?voteId=${task.id}`;

  return (
    <>
      <MjmlText>
        <div style={{ fontWeight: 'bold', color: greyColor2, marginBottom: 5 }}>
          {task.title}
        </div>
        <a href={voteTaskLink}>
          <h2 style={{
            fontSize: 16,
            marginBottom: 5
          }}
          >{task.page.title || 'Untitled'} | {task.space.name}
          </h2>
        </a>
        <div style={{
          color: darkModeColors.red,
          fontSize: 14,
          fontWeight: 'bold'
        }}
        >
          Ends {DateTime.fromJSDate(new Date(task.deadline)).toRelative({ base: (DateTime.now()) })}
        </div>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='20px' href={voteTaskLink}>
        Vote
      </MjmlButton>
    </>
  );
}

function MentionTask ({ task: { text, spaceDomain, spaceName, pagePath, pageTitle, mentionId } }: {task: MentionedTask}) {
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', color: greyColor2, marginBottom: 5 }}>
        {text}
      </div>
      <a href={`${charmverseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}`}>
        <h2 style={{
          fontSize: 16,
          marginBottom: 5
        }}
        >{pageTitle || 'Untitled'} | {spaceName}
        </h2>
      </a>
    </MjmlText>
  );
}

function MultisigTask ({ task }: { task: GnosisSafeTasks }) {
  log.debug('multi sig task', task);
  // console.log('multi sig task...', task.tasks[0].transactions);
  return (
    <>
      <MjmlText>
        <strong style={{ color: greyColor2 }}>
          Safe address: {shortenHex(task.safeAddress)}<br />
          {task.tasks[0].transactions[0].description}
        </strong>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='20px' href={task.tasks[0].transactions[0].myActionUrl}>
        {task.tasks[0].transactions[0].myAction}
      </MjmlButton>
    </>
  );
}
