import { baseUrl } from '@root/config/constants';

export function ProjectShareItem({ project }: { project: { name?: string | null; sunnyAwardsNumber: number | null } }) {
  const projectName = project.name?.substring(0, 30) || 'Untitled';
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
    top: '64px',
    left: '165px',
    maxWidth: '130px',
    wordWrap: 'break-word'
  } as const;

  return (
    <div style={cardStyle}>
      <img src={`${baseUrl}/images/project-share.jpg`} alt='Project Share' style={mediaStyle} />
      <div style={memberStackStyle}>
        <h1 style={{ fontWeight: 400, fontSize: '1rem', margin: 0, padding: 0 }}>{projectName}</h1>
        <h2 style={{ fontWeight: 400, fontSize: '0.8rem', margin: 0, padding: 0 }}>
          Ticket No: {project.sunnyAwardsNumber}
        </h2>
      </div>
    </div>
  );
}
