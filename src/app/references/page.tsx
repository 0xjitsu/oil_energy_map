import { dataReferences } from '@/data/references';
import type { Metadata } from 'next';
import { ReferencesContent } from './ReferencesContent';

export const metadata: Metadata = {
  title: 'Data Sources & Provenance — PH Oil Intelligence',
  description:
    'Every data source used in the PH Oil Intelligence dashboard, with provenance metadata, update frequency, and licensing information.',
};

export default function ReferencesPage() {
  return <ReferencesContent references={dataReferences} />;
}
