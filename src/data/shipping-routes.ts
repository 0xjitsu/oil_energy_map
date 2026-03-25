import { ShippingRoute } from '@/types';

export const shippingRoutes: ShippingRoute[] = [
  {
    id: 'hormuz',
    origin: 'Middle East (Persian Gulf)',
    destination: 'Petron Bataan Refinery',
    status: 'disrupted',
    color: '#ef4444',
    label: 'Middle East \u2192 Petron Bataan',
    notes: 'Primary crude supply route through Strait of Hormuz. Currently partially blocked due to US-Iran conflict, transit capacity down ~40%.',
    coordinates: [
      [26.5, 56.5],   // Persian Gulf (Strait of Hormuz)
      [20.0, 65.0],   // Arabian Sea
      [12.0, 76.0],   // Southern India
      [6.0, 88.0],    // Central Indian Ocean
      [2.0, 104.0],   // Malacca Strait approach
      [14.53, 120.6], // Petron Bataan Refinery
    ],
  },
  {
    id: 'espo',
    origin: 'Russia Far East (Kozmino)',
    destination: 'Petron Bataan Refinery',
    status: 'active',
    color: '#a855f7',
    label: 'Russia ESPO \u2192 Petron Bataan',
    notes: 'ESPO Blend crude from Russian Pacific port of Kozmino. Alternative supply route bypassing Hormuz chokepoint.',
    coordinates: [
      [42.73, 133.08], // Kozmino, Russia (ESPO terminal)
      [37.0, 131.0],   // East Sea / Sea of Japan
      [30.0, 128.0],   // East China Sea
      [22.0, 122.0],   // Luzon Strait approach
      [14.53, 120.6],  // Petron Bataan Refinery
    ],
  },
  {
    id: 'singapore',
    origin: 'Singapore (Jurong Island)',
    destination: 'Shell SHIFT Tabangao',
    status: 'active',
    color: '#10b981',
    label: 'Singapore \u2192 Shell SHIFT Tabangao',
    notes: 'Finished petroleum products (gasoline, diesel) from Singapore refineries. Key import route for Shell Philippines.',
    coordinates: [
      [1.27, 103.73],  // Jurong Island, Singapore
      [5.0, 108.0],    // South China Sea
      [9.0, 114.0],    // Central South China Sea
      [12.5, 118.5],   // Mindoro Strait approach
      [13.76, 121.08], // Shell SHIFT Tabangao, Batangas
    ],
  },
  {
    id: 'skorea',
    origin: 'South Korea (Yeosu)',
    destination: 'Chevron Lapu-Lapu Terminal',
    status: 'new',
    color: '#06b6d4',
    label: 'South Korea \u2192 Chevron Cebu',
    notes: 'Direct refined fuel shipments from South Korean refineries. New route diversifying Visayas supply away from Singapore dependency.',
    coordinates: [
      [34.74, 127.74], // Yeosu, South Korea
      [28.0, 126.0],   // East China Sea
      [22.0, 123.0],   // Philippine Sea approach
      [15.0, 122.0],   // Eastern Luzon waters
      [10.31, 123.97], // Chevron Lapu-Lapu Terminal, Cebu
    ],
  },
];
