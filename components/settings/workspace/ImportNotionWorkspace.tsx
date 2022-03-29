import useNotionImport from 'hooks/useNotionImport';
import NotionIcon from 'public/images/notion_logo.svg';
import SvgIcon from '@mui/material/SvgIcon';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Alert } from '@mui/material';
import { Box } from '@mui/system';

export default function ImportNotionWorkspace () {
  const {
    isImportingFromNotion,
    notionFailedImports,
    notionImportError
  } = useNotionImport();

  return (
    <div>
      <Button
        disabled={isImportingFromNotion}
        href={`/api/notion/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}`}
        variant='outlined'
        startIcon={(
          <SvgIcon sx={{ color: 'text.primary' }}>
            <NotionIcon />
          </SvgIcon>
      )}
        endIcon={(
        isImportingFromNotion && <CircularProgress size={20} />
      )}
      >
        {isImportingFromNotion ? 'Importing pages from Notion' : 'Import pages from Notion'}
      </Button>
      {notionFailedImports.length !== 0 && (
      <Alert severity='warning' sx={{ mt: 2 }}>
        <Box sx={{
          display: 'flex', gap: 2, flexDirection: 'column'
        }}
        >
          Pages where we encountered issues
          {notionFailedImports.map(failedImport => (
            <div>
              <Box sx={{
                display: 'flex',
                gap: 1
              }}
              >
                <span>Type: {failedImport.type}</span>
                <span>Title: {failedImport.title}</span>
                <span>Id: {failedImport.pageId}</span>
              </Box>
              {failedImport.blocks.length !== 0 ? (
                <div>
                  Blocks that failed to import for the page
                  {failedImport.blocks.map((blockTrails, blockTrailsIndex) => (
                    <div>
                      {blockTrailsIndex + 1}. {blockTrails.map(([blockType, blockIndex]) => `${blockType}(${blockIndex + 1})`).join(' -> ')}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </Box>
      </Alert>
      )}
      {notionImportError && (
      <Alert severity='error' sx={{ mt: 2 }}>
        {notionImportError}
      </Alert>
      )}
    </div>
  );
}
