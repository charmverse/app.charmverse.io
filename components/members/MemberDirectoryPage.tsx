import styled from '@emotion/styled';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export default function MemberDirectoryPage () {
  const { members } = useMembers();
  const { properties } = useMemberProperties();

  return properties && members ? (
    <CenteredPageContent>
      <Typography variant='h1' my={2}>Member Directory</Typography>

      <Table size='small'>
        <TableHead>
          <TableRow>
            {properties.map(property => <StyledTableCell>{property.name}</StyledTableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map(member => {
            return (
              <TableRow key={member.id}>
                {properties.map(property => {
                  const memberProperty = member.properties.find(_property => _property.id === property.id);
                  if (memberProperty) {
                    return (
                      <TableCell key={property.id}>
                        {memberProperty.value}
                      </TableCell>
                    );
                  }
                  return null;
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </CenteredPageContent>
  ) : null;
}
