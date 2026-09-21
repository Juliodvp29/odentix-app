import {
  CHART_COLORS,
  ENTRY_TYPE_LABELS,
  OdontogramEntry,
  QUADRANT_1,
  QUADRANT_2,
  QUADRANT_3,
  QUADRANT_4,
  TOOTH_NAMES,
  surfaceColor,
  surfaceLabel,
  toothState,
  toothStatus,
} from './odontogram-model';

describe('odontogram-model', () => {
  it('should report a clean tooth without entries', () => {
    const state = toothState([]);
    expect(state.highestPriorityType).toBeNull();
    expect(state.isMissing).toBe(false);
    expect(surfaceColor(state, 'oclusal')).toBe('var(--color-surface-alt)');
  });

  it('should resolve the highest priority type across entries', () => {
    const state = toothState([
      { id: 'entry-1', entryType: 'estado_actual', surface: 'oclusal', condition: 'Sano' },
      { id: 'entry-2', entryType: 'diagnostico', condition: 'Caries' },
      { id: 'entry-3', entryType: 'tratamiento_realizado', condition: 'Obturacion' },
    ]);
    expect(state.highestPriorityType).toBe('diagnostico');
    expect(surfaceColor(state, 'oclusal')).toBe(CHART_COLORS['estado_actual']);
    expect(surfaceColor(state, 'vestibular')).toBe('var(--color-surface-alt)');
  });

  it('should color each surface by its own highest priority entry', () => {
    const state = toothState([
      { id: 'entry-1', entryType: 'estado_actual', surface: 'oclusal', condition: 'Sano' },
      { id: 'entry-2', entryType: 'diagnostico', surface: 'oclusal', condition: 'Caries' },
      { id: 'entry-3', entryType: 'plan_propuesto', surface: 'vestibular', condition: 'Corona' },
    ]);
    expect(state.surfaceTypes['oclusal']).toBe('diagnostico');
    expect(state.surfaceTypes['vestibular']).toBe('plan_propuesto');
    expect(surfaceColor(state, 'oclusal')).toBe(CHART_COLORS['diagnostico']);
  });

  it('should detect a missing tooth by condition and ignore unknown values', () => {
    const unknownEntries = [
      { id: 'entry-1', entryType: 'diagnostico', condition: 'Pieza ausente' },
      { id: 'entry-2', entryType: 'invented', surface: 'invented', condition: 'X' },
    ] as unknown as OdontogramEntry[];
    const state = toothState(unknownEntries);
    expect(state.isMissing).toBe(true);
    expect(state.highestPriorityType).toBe('diagnostico');
  });

  it('should label surfaces in Spanish with a general fallback', () => {
    expect(surfaceLabel('oclusal')).toBe('Oclusal');
    expect(surfaceLabel('vestibular')).toBe('Vestibular');
    expect(surfaceLabel(undefined)).toBe('General');
    expect(surfaceLabel('general')).toBe('General');
  });

  it('should cover all 32 FDI teeth with names and quadrants', () => {
    const all = [...QUADRANT_1, ...QUADRANT_2, ...QUADRANT_3, ...QUADRANT_4];
    expect(all).toHaveLength(32);
    expect(new Set(all).size).toBe(32);
    for (const tooth of all) {
      expect(TOOTH_NAMES[tooth]).toBeTruthy();
    }
    expect(TOOTH_NAMES[16]).toContain('Molar');
  });

  it('should label entry types and summarize tooth status', () => {
    expect(ENTRY_TYPE_LABELS['diagnostico']).toBe('Diagnóstico');
    expect(toothStatus(toothState([])).label).toBe('Sin hallazgos');
    expect(toothStatus(toothState([{ id: 'entry-1', entryType: 'diagnostico' }])).label).toBe(
      'Requiere atención',
    );
    expect(
      toothStatus(toothState([{ id: 'entry-1', entryType: 'diagnostico', condition: 'Ausente' }]))
        .label,
    ).toBe('Pieza ausente');
    expect(toothStatus(toothState([{ id: 'entry-1', entryType: 'plan_propuesto' }])).label).toBe(
      'Plan pendiente',
    );
  });
});
