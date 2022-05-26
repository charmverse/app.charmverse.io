import { render, screen, fireEvent } from '@testing-library/react';
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

  it('should open identity modal', () => {
    render(<UserDetails />);
    fireEvent.click(screen.getByTestId('edit-identity'));
    expect(screen.getByText('Public Identity')).toBeTruthy();
  });

  it('should open social modal', () => {
    render(<UserDetails />);
    fireEvent.click(screen.getByTestId('Social media links'));
    expect(screen.getByText('edit-social')).toBeTruthy();
  });

  it('should open description modal', () => {
    render(<UserDetails />);
    fireEvent.click(screen.getByTestId('edit-description'));
    expect(screen.getByText('Describe yourself in a few words')).toBeTruthy();
  });

});
