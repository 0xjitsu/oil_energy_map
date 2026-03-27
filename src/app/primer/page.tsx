import type { Metadata } from 'next';
import { PrimerPage } from './PrimerPage';

export const metadata: Metadata = {
  title: 'Oil Primer — How Energy Reaches You | PH Oil Intelligence',
  description:
    'Interactive guide to the Philippine oil supply chain. Trace crude oil from extraction to your gas station and understand what drives pump prices.',
};

export default function Page() {
  return <PrimerPage />;
}
