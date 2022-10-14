import styled from '@emotion/styled';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export function MemberDirectoryTableView () {
  const { properties = [] } = useMemberProperties();
  const { members } = useMembers();

  return (
    <Table size='small'>
      <TableHead>
        <TableRow>
          {properties.map(property => <StyledTableCell key={property.name}>{property.name}</StyledTableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map(member => {
          return (
            <TableRow key={member.id}>
              {properties.map(property => {
                const memberProperty = member.properties.find(_property => _property.memberPropertyId === property.id);
                if (memberProperty) {
                  switch (property.type) {
                    case 'role': {
                      return (
                        <TableCell key={property.id}>
                          {member.roles.map(role => <Chip size='small' label={role.name} variant='outlined' />)}
                        </TableCell>
                      );
                    }
                    default: {
                      return (
                        <TableCell key={property.id}>
                          {memberProperty.value}
                        </TableCell>
                      );
                    }
                  }
                }
                return null;
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
