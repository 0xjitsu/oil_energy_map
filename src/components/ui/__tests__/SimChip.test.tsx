import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimChip } from '@/components/ui/SimChip';

describe('SimChip', () => {
  it('renders the default SIMULATED label', async () => {
    render(<SimChip />);
    expect(await screen.findByText(/simulated/i)).toBeTruthy();
  });
  it('renders a custom label', async () => {
    render(<SimChip label="Modeled scenario" />);
    expect(await screen.findByText(/modeled scenario/i)).toBeTruthy();
  });
});
