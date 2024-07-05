import type { ProjectData } from '@connect/lib/actions/fetchProject';

export function ProjectShareItem({ project }: { project: NonNullable<ProjectData> }) {
  const projectMembers = project.projectMembers;
  const projectName = project.name || 'Untitled';
  const defaultFont =
    'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

  const randomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const cardStyle = {
    position: 'relative',
    width: '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0',
    fontFamily: defaultFont,
    color: '#37352f',
    backgroundColor: '#fff'
  } as const;

  const mediaStyle = {
    objectFit: 'cover',
    objectPosition: 'center',
    width: '100%',
    height: '100px'
  } as const;

  const avatarStyle = {
    position: 'absolute',
    top: '50px',
    left: '25px',
    border: '1px solid #e0e0e0',
    borderRadius: '25px',
    objectFit: 'cover'
  } as const;

  const descriptionStyle = {
    overflow: 'hidden',
    margin: 0,
    padding: 0
  } as const;

  const memberStackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '15px 24px',
    marginTop: '45px'
  } as const;

  return (
    <div style={cardStyle}>
      {project.coverImage ? (
        <img style={mediaStyle} src={project.coverImage} alt={projectName} width='100%' />
      ) : (
        <div
          style={{
            background: `linear-gradient(to right,${randomColor()}, ${randomColor()} )`,
            width: '100%',
            height: '100px'
          }}
        />
      )}
      <img style={avatarStyle} src={project.avatar || ''} alt={project.name} width='100px' height='100px' />
      <div style={memberStackStyle}>
        <h1 style={{ fontWeight: 400, fontSize: '1.5rem', margin: 0, padding: 0 }}>{projectName}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {projectMembers.map((member) => (
            <img
              key={member.farcasterUser.fid}
              style={{ width: '30px', height: '30px', borderRadius: '50%', margin: '4px' }}
              src={member.farcasterUser.pfpUrl || ''}
              alt={member.farcasterUser.username || 'Untitled'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
