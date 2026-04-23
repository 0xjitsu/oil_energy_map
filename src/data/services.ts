// src/data/services.ts

export const servicesHero = {
  eyebrow: 'RES/RAP ENERGY PROCUREMENT · PHILIPPINES',
  h1Line1: 'Your bid window is 2 weeks.',
  h1Line2: 'Manual encoding takes 4–6.',
  subheadline:
    'AI eliminates the encoding bottleneck. Humans scan and validate. The platform does everything else.',
  chips: [
    { icon: '⚡', text: '~20% savings vs DU rates' },
    { icon: '⏱', text: '5–7 days to LOI-ready' },
    { icon: '🏪', text: 'Any franchise, any utility' },
  ],
  ctas: [
    { label: 'Request a Brief →', href: '#contact', variant: 'primary' as const },
    { label: 'See How It Works ↓', href: '#pipeline', variant: 'secondary' as const },
  ],
} as const;

export const savingsSlider = {
  min: 10,
  max: 2000,
  step: 10,
  defaultValue: 200,
  avgPerStore: 80_000,   // ₱80,000/month per store
  savingsRate: 0.20,
} as const;

export const savingsTiers = [
  { stores: '~50',     monthlySpend: '₱4M',   savingsPerMonth: '₱800K',  savingsPerYear: '₱9.6M'  },
  { stores: '~200',    monthlySpend: '₱16M',  savingsPerMonth: '₱3.2M',  savingsPerYear: '₱38.4M' },
  { stores: '~500',    monthlySpend: '₱40M',  savingsPerMonth: '₱8M',    savingsPerYear: '₱96M'   },
  { stores: '~1,000+', monthlySpend: '₱80M+', savingsPerMonth: '₱16M+',  savingsPerYear: '₱192M+' },
] as const;

export const kpiCards = [
  { value: '~20%',    label: 'vs DU rates',    sub: 'reduction'      },
  { value: '5–7 days', label: 'bills to LOI', sub: 'any scale'      },
  { value: '~50×',    label: 'faster encoding', sub: 'vs manual'    },
] as const;

export const beforeAfterItems = {
  before: [
    'Collect bills across 100+ DUs',
    'Manually encode each bill 1-by-1',
    '4–6 weeks to LOI-ready data',
    'Miss the bid window',
  ],
  after: [
    { text: 'Scan bills',            badge: 'human'     },
    { text: 'AI extracts everything', badge: 'automated' },
    { text: '5–7 days, LOI-ready',   badge: null        },
    { text: 'Submit before deadline', badge: null        },
  ],
  beforeStat:    '4–6 weeks',
  beforeStatSub: 'depending on scale',
  beforeBadge:   'window-ready only',
  afterStat:     '5–7 days',
  afterStatSub:  'any scale',
  afterBadge:    'actually done ✓',
} as const;

export const pipelineStages = [
  { num: 1, name: 'Extract',        desc: 'OCR + AI LLM'                        },
  { num: 2, name: 'Clean',          desc: '10 validation rules (C1–C10)'         },
  { num: 3, name: 'Dedup',          desc: '3-tier by store + period'             },
  { num: 4, name: 'Enrich',         desc: 'Geo + DU normalization'               },
  { num: 5, name: 'Compute',        desc: 'effective_rate, generation_rate'      },
  { num: 6, name: 'Aggregate',      desc: 'Meta / pipeline KPIs'                 },
  { num: 7, name: 'Bid Artifacts',  desc: 'data.json · Excel workbook · LOI'    },
] as const;

export const platformFeatures = [
  { emoji: '🎯', label: 'Opportunity'        },
  { emoji: '🗺', label: 'How to Navigate'   },
  { emoji: '📊', label: 'Portfolio KPIs'    },
  { emoji: '📍', label: 'Store Map'         },
  { emoji: '📈', label: 'Consumption Trends'},
  { emoji: '💡', label: 'Rate Landscape'    },
  { emoji: '🧠', label: 'Bid Intelligence'  },
  { emoji: '🧾', label: 'Bill Anatomy'      },
  { emoji: '🔢', label: 'Bid Simulator'     },
  { emoji: '🤝', label: 'Negotiation Playbook'},
  { emoji: '⚖️', label: 'Compare Proposals' },
  { emoji: '🏢', label: 'DU Deep Dive'      },
  { emoji: '📁', label: 'Data Room'         },
  { emoji: '🔬', label: 'Methodology'       },
] as const;

export const audiencePills = [
  { emoji: '🛒', label: 'Grocery chains'         },
  { emoji: '⛽', label: 'Fuel stations'          },
  { emoji: '🍔', label: 'Fast food networks'     },
  { emoji: '🏪', label: 'Any multi-site franchise'},
] as const;

export const servicesCTA = {
  eyebrow:  'READY TO BID?',
  h2Line1:  'Works for any franchise',
  h2Line2:  'with distributed utility bills.',
  sub:      "The platform is utility-agnostic. What's franchise-specific is only the store master schema — a single config file.",
  formEmail: 'bernadettemisa403@gmail.com',
  storeCountOptions: ['<50', '50–200', '200–1,000', '1,000+'],
} as const;
