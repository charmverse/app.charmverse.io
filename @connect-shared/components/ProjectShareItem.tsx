import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import { baseUrl } from '@root/config/constants';
import { stringToColor } from '@root/lib/utils/strings';

export function ProjectShareItem({ project }: { project: NonNullable<ConnectProjectDetails> }) {
  const projectName = project.name || 'Untitled';
  const defaultFont =
    'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

  const cardStyle = {
    position: 'relative',
    width: '500px',
    height: '260px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0',
    fontFamily: defaultFont,
    backgroundImage: `url(${baseUrl}/images/project-share.jpg)`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    color: '#d8be7d'
  } as const;

  const mediaStyle = {
    objectFit: 'cover',
    objectPosition: 'center',
    width: '100%',
    height: '100%'
  } as const;

  const avatarStyle = {
    borderRadius: '50%',
    objectFit: 'cover'
  } as const;

  const memberStackStyle = {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    top: '60px',
    left: '165px'
  } as const;

  return (
    <div style={cardStyle}>
      <img
        src={`${baseUrl}/images/project-share.jpg`}
        alt='Project Share'
        style={mediaStyle}
        width='500px'
        height='260px'
      />
      <div style={memberStackStyle}>
        {project.avatar ? (
          <img style={avatarStyle} src={project.avatar || ''} alt={project.name} width='40px' height='40px' />
        ) : (
          <div
            style={{
              ...avatarStyle,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: stringToColor(project.name)
            }}
          >
            <p style={{ fontSize: '30px' }}>{project.name?.charAt(0)?.toLocaleUpperCase()}</p>
          </div>
        )}
        <h1 style={{ fontWeight: 400, fontSize: '1rem', margin: 0, padding: 0 }}>{projectName.substring(0, 20)}</h1>
        <h2 style={{ fontWeight: 400, fontSize: '0.8rem', margin: 0, padding: 0 }}>
          Ticket No: {project.sunnyAwardsNumber}
        </h2>
      </div>
    </div>
  );
}
