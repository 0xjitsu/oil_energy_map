import type { Metadata } from 'next';
import { RoadmapContent } from './RoadmapContent';

export const metadata: Metadata = {
  title: 'Roadmap — PH Oil Intelligence',
  description:
    'What we are building next: real-time DOE pump prices, ASEAN expansion, ship tracking, and the global energy disruption map. See how to contribute.',
};

export default function Page() {
  return <RoadmapContent />;
}
