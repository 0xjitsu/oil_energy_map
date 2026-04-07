import type { Metadata } from 'next';
import { CascadePage } from './CascadePage';

export const metadata: Metadata = {
  title: 'Cascade Effects — PH Energy Intelligence',
  description:
    'Track how energy disruptions ripple through the Philippine economy — from crude oil to fertilizer, food prices, transport fares, and household budgets.',
};

export default function Page() {
  return <CascadePage />;
}
