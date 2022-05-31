import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IDENTITY_TYPES, LoggedInUser } from 'models';
import UserDetails from '../UserDetails';

function WrappedUserDetails () {

  const props = {
    readOnly: false,
    user: {
      id: '1',
      identityType: IDENTITY_TYPES[0],
      addresses: ['0x0000000000000000000000000000000000000000']
    } as LoggedInUser,
    updateUser: () => {}
  };

  return <UserDetails {...props} />;
}

// TO DO: make these tests work
describe('User details', () => {
  it.skip('should have back navigation text', () => {
    render(<WrappedUserDetails />);
    expect(screen.getByText('My Public Profile')).toBeTruthy();
  });

  it.skip('should have edit icons', () => {
    render(<WrappedUserDetails />);
    expect(screen.getByTestId('edit-identity')).toBeTruthy();
    expect(screen.getByTestId('edit-social')).toBeTruthy();
    expect(screen.getByTestId('edit-description')).toBeTruthy();
  });

  it.skip('should open identity modal', () => {
    render(<WrappedUserDetails />);
    fireEvent.click(screen.getByTestId('edit-identity'));
    expect(screen.getByText('Public Identity')).toBeTruthy();
  });

  it.skip('should open social modal', () => {
    render(<WrappedUserDetails />);
    fireEvent.click(screen.getByTestId('edit-social'));
    expect(screen.getByText('Social media links')).toBeTruthy();
  });

  it.skip('should open description modal', () => {
    render(<WrappedUserDetails />);
    fireEvent.click(screen.getByTestId('edit-description'));
    expect(screen.getByText('Describe yourself in a few words')).toBeTruthy();
  });

});
