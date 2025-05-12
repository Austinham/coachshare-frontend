import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dumbbell } from 'lucide-react';
import StatCard from './StatCard';

describe('StatCard', () => {
  const defaultProps = {
    title: 'Total Workouts',
    value: '42',
    icon: <Dumbbell className="h-5 w-5 text-blue-500" />,
    bgColor: 'bg-blue-50'
  };

  it('renders with all required props', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with numeric value', () => {
    render(<StatCard {...defaultProps} value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies custom background color', () => {
    render(<StatCard {...defaultProps} bgColor="bg-red-50" />);
    const iconContainer = screen.getByText('42').parentElement?.nextElementSibling;
    expect(iconContainer).toHaveClass('bg-red-50');
  });

  it('renders with custom icon', () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(<StatCard {...defaultProps} icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders without optional props', () => {
    render(
      <StatCard
        title="Basic Card"
        value="Simple"
        icon={<span>•</span>}
        bgColor="bg-gray-50"
      />
    );
    expect(screen.getByText('Basic Card')).toBeInTheDocument();
    expect(screen.getByText('Simple')).toBeInTheDocument();
  });
}); 