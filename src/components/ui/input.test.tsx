import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input Component', () => {
  it('renders with default styles', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('custom-input');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Enter text" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeDisabled();
  });

  it('handles type prop', () => {
    render(<Input type="password" placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles required prop', () => {
    render(<Input required placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeRequired();
  });

  it('handles aria-label', () => {
    render(<Input aria-label="Username" />);
    const input = screen.getByLabelText('Username');
    expect(input).toBeInTheDocument();
  });
}); 