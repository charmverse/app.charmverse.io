'use client';

import type { Grant } from '@connect-shared/lib/grants/getGrants';
import { Button, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { FaChevronUp } from 'react-icons/fa6';

import { Avatar } from 'components/common/Avatar';
import { CardMotion } from 'components/common/Motions/CardMotion';

export function GrantItem({ grant }: { grant: Grant }) {
  const grantName = grant.name || 'Untitled';
  const [showDetails, setShowDetails] = useState(false);

  return (
    <CardMotion>
      <CardActionArea
        sx={{ p: 2 }}
        onClick={() => {
          if (!showDetails) {
            setShowDetails(true);
          }
        }}
      >
        <Stack gap={3}>
          <Stack direction='row' gap={2}>
            {grant.logo ? (
              <CardMedia
                component='img'
                alt={grantName}
                src={grant.logo}
                sx={{ width: '50px', height: '50px', borderRadius: 3 }}
              />
            ) : (
              <Avatar avatar={undefined} name={grantName} alt={grantName} size='large' variant='rounded' />
            )}
            <Box display='flex' justifyContent='space-between' flexDirection='column' alignItems='start'>
              <Typography
                overflow='hidden'
                sx={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: '1'
                }}
              >
                {grantName}
              </Typography>
              <Typography variant='body2' color='secondary'>
                Grants Program
              </Typography>
            </Box>
          </Stack>
          {grant.announcement && <Typography>{grant.announcement}</Typography>}
          {grant.status && (
            <Typography variant='subtitle2' textTransform='uppercase' color='secondary'>
              {grant.status}
            </Typography>
          )}
          {grant.banner && (
            <CardMedia component='img' alt={grantName} src={grant.banner} sx={{ width: '100%', height: '250px' }} />
          )}
          {showDetails && (
            <>
              {grant.description && <Typography>{grant.description}</Typography>}
              {grant.launchDate && grant.launchDate.to && (
                <Typography>
                  <b>Application Deadline:</b> {new Date(grant.launchDate.to).toUTCString()}
                </Typography>
              )}
              {grant.applyLink && (
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                  <FaChevronUp
                    onClick={() => {
                      setShowDetails(false);
                    }}
                  />
                  <Button href={grant.applyLink} variant='contained' target='_blank' color='primary'>
                    Apply
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </CardActionArea>
    </CardMotion>
  );
}
