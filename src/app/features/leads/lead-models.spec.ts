import { describe, expect, it } from 'vitest';
import {
  LEAD_ACTIVITY_TYPES,
  LEAD_ACTIVITY_TYPE_META,
  LEAD_STAGES,
  LEAD_STAGE_META,
  LeadResponse,
  assigneeInitials,
  emptyLeadsByStage,
  groupLeadsByStage,
  splitLeadName,
} from './lead-models';

function lead(id: string, status: LeadResponse['status']): LeadResponse {
  return { id, fullName: `Lead ${id}`, status };
}

describe('lead stages', () => {
  it('should follow the backend funnel order', () => {
    expect([...LEAD_STAGES]).toEqual([
      'nuevo',
      'contactado',
      'calificado',
      'cita_propuesta',
      'cita_agendada',
      'cita_asistida',
      'tratamiento_propuesto',
      'tratamiento_aceptado',
      'perdido',
    ]);
  });

  it('should label every stage in Spanish with the approved tones', () => {
    expect(LEAD_STAGE_META.nuevo.textClass).toContain('ink-soft');
    expect(LEAD_STAGE_META.contactado.textClass).toContain('info');
    expect(LEAD_STAGE_META.calificado.textClass).toContain('info');
    expect(LEAD_STAGE_META.cita_agendada.textClass).toContain('teal');
    expect(LEAD_STAGE_META.tratamiento_propuesto.textClass).toContain('warning');
    expect(LEAD_STAGE_META.tratamiento_aceptado.textClass).toContain('success');
    expect(LEAD_STAGE_META.perdido.textClass).toContain('danger');
    for (const stage of LEAD_STAGES) {
      expect(LEAD_STAGE_META[stage].label).toBeTruthy();
    }
  });
});

describe('groupLeadsByStage', () => {
  it('should group leads into their stages', () => {
    const grouped = groupLeadsByStage([
      lead('1', 'nuevo'),
      lead('2', 'nuevo'),
      lead('3', 'cita_agendada'),
    ]);
    expect(grouped.nuevo.map((item) => item.id)).toEqual(['1', '2']);
    expect(grouped.cita_agendada.map((item) => item.id)).toEqual(['3']);
    expect(grouped.perdido).toEqual([]);
  });

  it('should include an empty column for every stage', () => {
    expect(Object.keys(emptyLeadsByStage()).sort()).toEqual([...LEAD_STAGES].sort());
  });

  it('should fall back to nuevo for unknown or missing statuses', () => {
    const grouped = groupLeadsByStage([lead('9', undefined)]);
    expect(grouped.nuevo.map((item) => item.id)).toEqual(['9']);
  });
});
describe('assigneeInitials', () => {
  it('should build initials from first and last names', () => {
    expect(assigneeInitials('Ana Torres')).toBe('AT');
    expect(assigneeInitials('Carlos Pérez Gómez')).toBe('CG');
    expect(assigneeInitials('Madonna')).toBe('MA');
    expect(assigneeInitials(null)).toBe('—');
    expect(assigneeInitials('')).toBe('—');
  });
});

describe('splitLeadName', () => {
  it('should split the first token from the rest like the backend', () => {
    expect(splitLeadName('Ana Torres')).toEqual({ firstName: 'Ana', lastName: 'Torres' });
    expect(splitLeadName('Carlos Pérez Gómez')).toEqual({
      firstName: 'Carlos',
      lastName: 'Pérez Gómez',
    });
    expect(splitLeadName('Madonna')).toEqual({ firstName: 'Madonna', lastName: '' });
    expect(splitLeadName(null)).toEqual({ firstName: '', lastName: '' });
  });
});

describe('lead activity types', () => {  it('should cover every backend activity type with a Spanish label', () => {
    expect([...LEAD_ACTIVITY_TYPES]).toEqual(['llamada', 'whatsapp', 'email', 'nota']);
    expect(LEAD_ACTIVITY_TYPE_META.llamada.label).toBe('Llamada');
    expect(LEAD_ACTIVITY_TYPE_META.whatsapp.label).toBe('WhatsApp');
    expect(LEAD_ACTIVITY_TYPE_META.email.label).toBe('Correo');
    expect(LEAD_ACTIVITY_TYPE_META.nota.label).toBe('Nota');
    for (const type of LEAD_ACTIVITY_TYPES) {
      expect(LEAD_ACTIVITY_TYPE_META[type].bgClass).toBeTruthy();
      expect(LEAD_ACTIVITY_TYPE_META[type].textClass).toBeTruthy();
    }
  });
});
