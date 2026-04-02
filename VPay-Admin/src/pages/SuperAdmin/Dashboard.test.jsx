import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('SuperAdmin Dashboard Integration', () => {
  it('renders all security/admin feature sections', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
    expect(screen.getByText(/Activity Logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Session Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/IP Whitelist/i)).toBeInTheDocument();
    expect(screen.getByText(/Notification Center/i)).toBeInTheDocument();
  });

  it('renders sidebar links for all features', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Two-Factor Auth/i)).toBeInTheDocument();
    expect(screen.getByText(/Activity Logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Session Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/IP Whitelist/i)).toBeInTheDocument();
    expect(screen.getByText(/Notification Center/i)).toBeInTheDocument();
  });
});
