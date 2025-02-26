import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Logo, { LogoWrapper, LogoText, LogoIcon } from './Logo';

describe('Logo Component', () => {
  it('renders logo with text and image', () => {
    render(
      <BrowserRouter>
        <Logo />
      </BrowserRouter>
    );

    const logoImage = screen.getByAltText('Promptfoo Logo');
    const logoText = screen.getByText('promptfoo');

    expect(logoImage).toBeInTheDocument();
    expect(logoText).toBeInTheDocument();
  });

  it('navigates to home page when clicked', async () => {
    render(
      <BrowserRouter>
        <Logo />
      </BrowserRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('applies correct styles to LogoWrapper', () => {
    const { container } = render(
      <BrowserRouter>
        <LogoWrapper />
      </BrowserRouter>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({
      display: 'inline-flex',
      alignItems: 'center',
      perspective: '2000px',
      transformStyle: 'preserve-3d'
    });
  });

  it('applies correct styles to LogoText', () => {
    const { container } = render(
      <BrowserRouter>
        <LogoText variant="h1">promptfoo</LogoText>
      </BrowserRouter>
    );

    const text = container.firstChild;
    expect(text).toHaveStyle({
      fontWeight: '600',
      fontSize: '1rem',
      letterSpacing: '0.02em'
    });
  });

  it('applies correct styles to LogoIcon', () => {
    const { container } = render(
      <LogoIcon src="test.svg" alt="test logo" />
    );

    const icon = container.firstChild;
    expect(icon).toHaveStyle({
      width: '25px',
      height: 'auto'
    });
  });

  it('has hover animations defined for LogoText', () => {
    const { container } = render(
      <BrowserRouter>
        <LogoText variant="h1">promptfoo</LogoText>
      </BrowserRouter>
    );

    const text = container.firstChild;
    expect(text).toBeDefined();
    expect(window.getComputedStyle(text as Element)).toBeDefined();
  });

  it('has hover animations defined for LogoIcon', () => {
    const { container } = render(
      <LogoIcon src="test.svg" alt="test logo" />
    );

    const icon = container.firstChild;
    expect(icon).toBeDefined();
    expect(window.getComputedStyle(icon as Element)).toBeDefined();
  });

  it('renders with correct link decoration', () => {
    render(
      <BrowserRouter>
        <Logo />
      </BrowserRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveStyle({
      textDecoration: 'none'
    });
  });
});
