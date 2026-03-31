import type { ScenarioParams } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';

export interface ConsumerPersona {
  id: string;
  icon: string;
  label: string;
  description: string;
  monthlyBaseline: number;
  fuelType: 'gasoline' | 'diesel';
  dailyLiters: number;
  workDaysPerMonth: number;
  incomeEstimate: number;
}

export interface ImpactResultData {
  monthlyCostDelta: number;
  percentOfIncome: number;
  painIndex: number;
  monthlyLiters: number;
  newMonthlyTotal: number;
}

export const PERSONAS: ConsumerPersona[] = [
  {
    id: 'jeepney',
    icon: '🚐',
    label: 'Jeepney Driver',
    description: 'Public utility vehicle, daily operations in Metro Manila',
    monthlyBaseline: 7800,
    fuelType: 'diesel',
    dailyLiters: 15,
    workDaysPerMonth: 26,
    incomeEstimate: 18000,
  },
  {
    id: 'household',
    icon: '🏠',
    label: 'Household',
    description: 'Family of 4, 1 vehicle, monthly LPG for cooking',
    monthlyBaseline: 6400,
    fuelType: 'gasoline',
    dailyLiters: 4,
    workDaysPerMonth: 30,
    incomeEstimate: 45000,
  },
  {
    id: 'sme',
    icon: '🏪',
    label: 'SME Owner',
    description: 'Small business with 3 delivery vehicles + generator',
    monthlyBaseline: 24000,
    fuelType: 'diesel',
    dailyLiters: 30,
    workDaysPerMonth: 26,
    incomeEstimate: 80000,
  },
  {
    id: 'fleet',
    icon: '🚛',
    label: 'Logistics Fleet',
    description: '20-truck fleet, bulk diesel purchasing, nationwide routes',
    monthlyBaseline: 480000,
    fuelType: 'diesel',
    dailyLiters: 600,
    workDaysPerMonth: 26,
    incomeEstimate: 2000000,
  },
];

const BASELINE_PUMP_GASOLINE = 65;
const BASELINE_PUMP_DIESEL = 59;

export function calculateImpact(
  persona: ConsumerPersona,
  scenarioParams: ScenarioParams,
): ImpactResultData {
  const result = calculatePumpPrice(scenarioParams);
  const currentPrice = persona.fuelType === 'gasoline' ? result.gasoline : result.diesel;
  const baselinePrice = persona.fuelType === 'gasoline' ? BASELINE_PUMP_GASOLINE : BASELINE_PUMP_DIESEL;

  const monthlyLiters = persona.dailyLiters * persona.workDaysPerMonth;
  const monthlyCostDelta = monthlyLiters * (currentPrice - baselinePrice);
  const percentOfIncome = (monthlyCostDelta / persona.incomeEstimate) * 100;
  const painIndex = Math.min(10, Math.max(1, Math.round(Math.abs(percentOfIncome) * 2)));

  return {
    monthlyCostDelta: Math.round(monthlyCostDelta),
    percentOfIncome: Math.round(percentOfIncome * 10) / 10,
    painIndex,
    monthlyLiters,
    newMonthlyTotal: Math.round(persona.monthlyBaseline + monthlyCostDelta),
  };
}
