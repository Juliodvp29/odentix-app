import { describe, expect, it } from 'vitest';
import {
  actionTypeLabel,
  defaultMetricsRange,
  groupOpportunities,
  opportunityTitle,
  opportunityValue,
  priorityTier,
  rangeBounds,
  recoveredTotals,
  recoveryCategoryRows,
  totalValue,
  valueLabel,
} from './opportunity-models';
import { OpportunityResponse } from './opportunity-models';
import { RecoveredValueResponse } from './opportunity-models';

const LEAD: OpportunityResponse = {
  id: 'o-1',
  type: 'lead_sin_respuesta',
  priority: 5,
  estimatedValueCop: 300000,
  status: 'abierta',
  actions: [{ suggestedMessage: 'Llamar a Ana\nTiene interés en ortodoncia.' }],
};

const OVERDUE: OpportunityResponse = {
  id: 'o-2',
  type: 'saldo_vencido',
  priority: 4,
  estimatedValueCop: 150000,
  status: 'abierta',
};

const LEAD_LOW: OpportunityResponse = {
  id: 'o-3',
  type: 'lead_sin_respuesta',
  priority: 2,
  estimatedValueCop: 500000,
  status: 'abierta',
};

describe('priorityTier', () => {
  it('should mirror the backend alta/media/baja thresholds', () => {
    expect(priorityTier(5)).toBe('high');
    expect(priorityTier(4)).toBe('high');
    expect(priorityTier(3)).toBe('medium');
    expect(priorityTier(2)).toBe('low');
    expect(priorityTier(null)).toBe('low');
    expect(priorityTier(undefined)).toBe('low');
  });
});

describe('opportunityTitle', () => {
  it('should use the first line of the suggested message', () => {
    expect(opportunityTitle(LEAD)).toBe('Llamar a Ana');
  });

  it('should fall back without actions or message', () => {
    expect(opportunityTitle(OVERDUE)).toBe('Oportunidad detectada');
    expect(opportunityTitle({ actions: [] })).toBe('Oportunidad detectada');
  });
});

describe('opportunityValue and totalValue', () => {
  it('should sum estimated values treating missing as zero', () => {
    expect(opportunityValue(LEAD)).toBe(300000);
    expect(opportunityValue({})).toBe(0);
    expect(totalValue([LEAD, OVERDUE, LEAD_LOW])).toBe(950000);
  });

  it('should format values as COP', () => {
    expect(valueLabel(300000)).toContain('300.000');
  });
});

describe('actionTypeLabel', () => {
  it('should label every known action type in Spanish', () => {
    expect(actionTypeLabel('crear_tarea')).toBe('Crear tarea');
    expect(actionTypeLabel('enviar_mensaje')).toBe('Enviar mensaje');
  });

  it('should fall back without an action type', () => {
    expect(actionTypeLabel(null)).toBe('Sin acción sugerida');
    expect(actionTypeLabel(undefined)).toBe('Sin acción sugerida');
  });
});

describe('groupOpportunities', () => {
  it('should group by type keeping type order and sorting by priority', () => {
    const groups = groupOpportunities([OVERDUE, LEAD_LOW, LEAD]);
    expect(groups.map((group) => group.type)).toEqual(['lead_sin_respuesta', 'saldo_vencido']);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['o-1', 'o-3']);
    expect(groups[0]?.groupValue).toBe(800000);
  });

  it('should skip empty types', () => {
    expect(groupOpportunities([])).toEqual([]);
  });
});

describe('defaultMetricsRange and rangeBounds', () => {
  it('should cover the last 30 days as Bogota day bounds', () => {
    const range = defaultMetricsRange(new Date(2026, 8, 28));
    expect(range).toEqual({ from: '2026-08-30', to: '2026-09-28' });
    expect(rangeBounds(range)).toEqual({
      from: '2026-08-30T00:00:00-05:00',
      to: '2026-09-28T23:59:59-05:00',
    });
  });
});

describe('recoveredTotals and recoveryCategoryRows', () => {
  const items: RecoveredValueResponse[] = [
    { type: 'saldo_vencido', totalAmountCop: 150000, count: 2 },
    { type: 'lead_sin_respuesta', totalAmountCop: 300000, count: 1 },
  ];

  it('should total amounts and counts', () => {
    expect(recoveredTotals(items)).toEqual({ total: 450000, count: 3 });
    expect(recoveredTotals([])).toEqual({ total: 0, count: 0 });
  });

  it('should sort categories by amount with proportional bars', () => {
    const rows = recoveryCategoryRows(items);
    expect(rows.map((row) => row.label)).toEqual(['Lead sin respuesta', 'Saldo vencido']);
    expect(rows[0]?.amount).toContain('300.000');
    expect(rows[0]?.width).toBe('100%');
    expect(rows[1]?.width).toBe('50%');
    expect(rows[1]?.detail).toBe('2 recuperadas');
  });
});
