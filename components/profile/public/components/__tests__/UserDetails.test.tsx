import React from 'react';
import { render, screen } from '@testing-library/react';
import UserDetails from '../UserDetails';

describe('User details', () => {
  it('should have back navigation text', () => {
    render(<UserDetails />);
    expect(screen.getByText('My Public Profile')).toBeTruthy();
  });

  it('should have edit icons', () => {
    render(<UserDetails />);
    expect(screen.getByTestId('edit-identity')).toBeTruthy();
    expect(screen.getByTestId('edit-social')).toBeTruthy();
    expect(screen.getByTestId('edit-description')).toBeTruthy();
  });

});
