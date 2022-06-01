import {
  MjmlSection,
  MjmlColumn,
  MjmlGroup,
  MjmlText,
  MjmlButton,
  MjmlImage,
  MjmlDivider
} from 'mjml-react';
import { User } from '@prisma/client';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { blackColor, blueColor, greyColor, greyColor2, lightGreyColor } from 'theme/colors';
import { Footer, Header, EmailWrapper } from './components';

type TemplateUser = Pick<User, 'username'>;

export interface PendingTasksProps {
  user: TemplateUser;
  tasks: GnosisSafeTasks[];
}

const domain = process.env.DOMAIN;
const chatIconPath = '/images/icons/speech-bubbles.png';

export default function PendingTasks (props: PendingTasksProps) {

  return (

    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h1>Hello {props.user.username},<br />You have {props.tasks.length} open task{props.tasks.length > 1 ? 's' : ''}</h1>
          </MjmlText>

          {props.tasks.map(task => <MultisigTask key={task.safeAddress} task={task} />)}

        </MjmlColumn>
      </MjmlSection>

      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <MjmlDivider />
        </MjmlColumn>
      </MjmlSection>

      <MjmlSection backgroundColor='#fff'>
        <MjmlGroup>
          <MjmlColumn width='20%'>
            <MjmlImage
              align='center'
              height='47px'
              width='64px'
              src={`${domain}/${chatIconPath}`}
            />
          </MjmlColumn>
          <MjmlColumn width='80%'>
            <MjmlText paddingLeft={0}>
              <p>
                <strong>
                  Do you have any feedback on this email?
                </strong>
              </p>
              <p>Please share it with us in <a href='https://discord.gg/ACYCzBGC2M'>Discord</a></p>
            </MjmlText>
          </MjmlColumn>
        </MjmlGroup>
      </MjmlSection>

      <Footer />
    </EmailWrapper>
  );
}

function MultisigTask ({ task }: { task: GnosisSafeTasks }) {

  const charmUrl = 'https://app.charmverse.io/profile/tasks';

  return (
    <>
      <MjmlText>
        <a href={charmUrl}>
          <h2>Multi sig transaction</h2>
        </a>
        <strong style={{ color: greyColor2 }}>
          Safe address: {task.safeAddress}<br />
          {task.tasks[0].transactions[0].description}
        </strong>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='40px' href={task.tasks[0].transactions[0].myActionUrl}>
        {task.tasks[0].transactions[0].myAction}
      </MjmlButton>
    </>
  );
}
