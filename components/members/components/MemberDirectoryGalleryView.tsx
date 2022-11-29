import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import { Card, Chip, Grid, IconButton, Stack, Typography } from '@mui/material';
import type { MemberProperty, MemberPropertyType } from '@prisma/client';
import { useState } from 'react';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { MemberPropertiesPopup } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopup';
import { SocialIcons } from 'components/profile/components/UserDetails/SocialIcons';
import type { Social } from 'components/profile/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';

import { MemberPropertyTextMultiline } from './MemberDirectoryProperties/MemberPropertyTextMultiline';
import { TimezoneDisplay } from './TimezoneDisplay';

const StyledLink = styled(Link)`
  ${hoverIconsStyle({ absolutePositioning: true })};

  height: 100%;
  display: flex;
  &:hover {
    opacity: 0.8;
  }
  position: relative;
`;

function MemberDirectoryGalleryCard({ member }: { member: Member }) {
  const { properties = [] } = useMemberProperties();
  const propertiesRecord = properties.reduce<Record<MemberPropertyType, MemberProperty>>((record, prop) => {
    record[prop.type] = prop;
    return record;
  }, {} as any);

  const currentSpace = useCurrentSpace();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutateMembers } = useMembers();

  const isNameHidden = !propertiesRecord.name?.enabledViews.includes('gallery');
  const isDiscordHidden = !propertiesRecord.discord?.enabledViews.includes('gallery');
  const isTwitterHidden = !propertiesRecord.twitter?.enabledViews.includes('gallery');
  const admin = isAdmin();

  const updateMemberPropertyValues = async (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => {
    await charmClient.members.updateSpacePropertyValues(member.id, spaceId, values);
    mutateMembers();
  };

  const social = (member.profile?.social as Social) ?? {};
  return (
    <>
      <StyledLink
        href={`/u/${member.path || member.id}${currentSpace ? `?workspace=${currentSpace.id}` : ''}`}
        color='primary'
      >
        <Card sx={{ width: '100%' }}>
          {((user?.id === member.id && currentSpace) || admin) && (
            <IconButton
              size='small'
              className='icons'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              style={
                !admin
                  ? {
                      opacity: 1
                    }
                  : {}
              }
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
          <Avatar
            sx={{
              width: '100%'
            }}
            avatar={member.avatar}
            name={member.username}
            size='2xLarge'
            variant='square'
          />
          <Stack p={2} gap={1}>
            {!isNameHidden && (
              <Typography gutterBottom variant='h6' mb={0} component='div'>
                {member.properties.find(
                  (memberProperty) => memberProperty.memberPropertyId === propertiesRecord.name?.id
                )?.value ?? member.username}
              </Typography>
            )}
            <SocialIcons gap={1} social={social} showDiscord={!isDiscordHidden} showTwitter={!isTwitterHidden} />
            {properties.map((property) => {
              const memberProperty = member.properties.find((mp) => mp.memberPropertyId === property.id);
              const hiddenInGallery = !property.enabledViews.includes('gallery');
              if (hiddenInGallery) {
                return null;
              }
              switch (property.type) {
                case 'bio': {
                  return (
                    member.profile?.description && (
                      <Stack key={property.id}>
                        <Typography fontWeight='bold' variant='subtitle2'>
                          Bio
                        </Typography>
                        <Typography
                          sx={{
                            wordBreak: 'break-word'
                          }}
                          variant='body2'
                        >
                          {member.profile?.description}
                        </Typography>
                      </Stack>
                    )
                  );
                }

                case 'join_date': {
                  return (
                    <Stack key={property.id}>
                      <Typography fontWeight='bold' variant='subtitle2'>
                        {property.name}
                      </Typography>
                      <Typography variant='body2'>
                        {humanFriendlyDate(member.joinDate, {
                          withYear: true
                        })}
                      </Typography>
                    </Stack>
                  );
                }
                case 'role': {
                  return (
                    member.roles.length !== 0 && (
                      <Stack gap={0.5} key={property.id}>
                        <Typography fontWeight='bold' variant='subtitle2'>
                          Role
                        </Typography>
                        <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                          {member.roles.map((role) => (
                            <Chip label={role.name} key={role.id} size='small' variant='outlined' />
                          ))}
                        </Stack>
                      </Stack>
                    )
                  );
                }
                case 'timezone': {
                  return (
                    member.profile?.timezone && (
                      <Stack flexDirection='row' gap={1} key={property.id}>
                        <TimezoneDisplay showTimezone timezone={member.profile.timezone} />
                      </Stack>
                    )
                  );
                }
                case 'text_multiline': {
                  return (
                    memberProperty?.value && (
                      <MemberPropertyTextMultiline
                        key={property.id}
                        label={property.name}
                        value={memberProperty.value as string}
                      />
                    )
                  );
                }
                case 'text':
                case 'phone':
                case 'email':
                case 'url':
                case 'number': {
                  return (
                    memberProperty?.value && (
                      <Stack
                        key={property.id}
                        sx={{
                          wordBreak: 'break-word'
                        }}
                      >
                        <Typography fontWeight='bold' variant='subtitle2'>
                          {property.name}
                        </Typography>
                        <Typography variant='body2'>{memberProperty.value}</Typography>
                      </Stack>
                    )
                  );
                }
                case 'select':
                case 'multiselect': {
                  return memberProperty ? (
                    <SelectPreview
                      size='small'
                      options={property.options as SelectOptionType[]}
                      value={memberProperty.value as string | string[]}
                      name={property.name}
                      key={property.id}
                    />
                  ) : null;
                }

                default: {
                  return null;
                }
              }
            })}
          </Stack>
        </Card>
      </StyledLink>
      {isModalOpen && user && currentSpace && (
        <MemberPropertiesPopup
          onClose={() => {
            setIsModalOpen(false);
          }}
          memberId={member.id}
          spaceId={currentSpace.id}
          updateMemberPropertyValues={updateMemberPropertyValues}
        />
      )}
    </>
  );
}

export function MemberDirectoryGalleryView({ members }: { members: Member[] }) {
  return (
    <Grid container gap={2.5}>
      {members.map((member) => (
        <Grid item xs={12} sm={5} md={3.75} key={member.id}>
          <MemberDirectoryGalleryCard member={member} />
        </Grid>
      ))}
    </Grid>
  );
}
