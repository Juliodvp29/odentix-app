import {
  TableColumn,
  activeFilterCount,
  describeFilter,
  formatCurrencyCop,
  formatDateEs,
  initialsOf,
  isFilterActive,
} from './table-models';

describe('table models', () => {
  describe('isFilterActive', () => {
    it('should reject empty values of every kind', () => {
      expect(isFilterActive(undefined)).toBe(false);
      expect(isFilterActive('')).toBe(false);
      expect(isFilterActive([])).toBe(false);
      expect(isFilterActive({})).toBe(false);
    });

    it('should accept set values of every kind', () => {
      expect(isFilterActive('Dentist')).toBe(true);
      expect(isFilterActive(['a', 'b'])).toBe(true);
      expect(isFilterActive({ from: '2026-01-01' })).toBe(true);
      expect(isFilterActive({ to: '2026-01-31' })).toBe(true);
      expect(isFilterActive({ min: 100 })).toBe(true);
      expect(isFilterActive({ max: 500 })).toBe(true);
    });

    it('should count only active filters', () => {
      expect(activeFilterCount({ role: 'Dentist', name: '', tags: [] })).toBe(1);
    });
  });

  describe('describeFilter', () => {
    const selectColumn: TableColumn = {
      key: 'role',
      header: 'Role',
      filter: {
        kind: 'select',
        options: [{ value: 'dentist', label: 'Dentist' }],
      },
    };

    it('should describe a select filter with its option label', () => {
      expect(describeFilter(selectColumn, 'dentist')).toBe('Role: Dentist');
    });

    it('should describe a multi filter with its count', () => {
      const column: TableColumn = {
        key: 'role',
        header: 'Role',
        filter: {
          kind: 'multi',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      };
      expect(describeFilter(column, ['a'])).toBe('Role: A');
      expect(describeFilter(column, ['a', 'b'])).toBe('Role: 2 seleccionados');
    });

    it('should describe date ranges', () => {
      const column: TableColumn = { key: 'joined', header: 'Joined', filter: { kind: 'date' } };
      expect(describeFilter(column, { from: '2026-01-01', to: '2026-01-31' })).toContain(
        'Joined: ',
      );
      expect(describeFilter(column, { from: '2026-01-01' })).toContain('desde ');
      expect(describeFilter(column, { to: '2026-01-31' })).toContain('hasta ');
    });

    it('should describe number ranges', () => {
      const column: TableColumn = { key: 'salary', header: 'Salary', filter: { kind: 'number' } };
      expect(describeFilter(column, { min: 100, max: 500 })).toBe('Salary: 100 – 500');
      expect(describeFilter(column, { min: 100 })).toBe('Salary: ≥ 100');
      expect(describeFilter(column, { max: 500 })).toBe('Salary: ≤ 500');
    });
  });

  describe('initialsOf', () => {
    it('should take the first letters of the first two words', () => {
      expect(initialsOf('María José')).toBe('MJ');
      expect(initialsOf('ana')).toBe('A');
      expect(initialsOf('  Luis  Pérez  Gómez ')).toBe('LP');
    });
  });

  describe('formatDateEs', () => {
    it('should format an ISO date in Spanish without shifting the day', () => {
      expect(formatDateEs('2026-01-12')).toContain('2026');
      expect(formatDateEs('2026-01-12')).toContain('12');
    });

    it('should return invalid input untouched', () => {
      expect(formatDateEs('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatCurrencyCop', () => {
    it('should format an amount as Colombian pesos', () => {
      const formatted = formatCurrencyCop(1200000);
      expect(formatted).toContain('1.200.000');
    });

    it('should return non-numeric input untouched', () => {
      expect(formatCurrencyCop('abc')).toBe('abc');
    });
  });
});
