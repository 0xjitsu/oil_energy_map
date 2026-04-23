// src/app/services/page.tsx
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ServicesPage } from './ServicesPage';

export const metadata: Metadata = {
  title: 'RES/RAP Energy Procurement Intelligence | Energy Intelligence Map',
  description:
    'AI-powered electricity bill extraction and bid intelligence platform for Philippine franchise operators. Cut 4–6 weeks of manual encoding to 5–7 days.',
};

export default function Services() {
  return (
    <>
      <Header showTicker={false} />
      <main>
        <ServicesPage />
      </main>
      <Footer />
    </>
  );
}
