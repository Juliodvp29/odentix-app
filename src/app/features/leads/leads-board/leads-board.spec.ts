import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { LeadResponse } from '../lead-models';
import { LeadsService } from '../leads.service';
import { LeadsBoard } from './leads-board';

function lead(id: string, status: LeadResponse['status'], name = `Lead ${id}`): LeadResponse {
  return { id, fullName: name, status };
}

describe('LeadsBoard', () => {
  let fixture: ComponentFixture<LeadsBoard>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(
    content: LeadResponse[] | null = [lead('1', 'nuevo'), lead('2', 'cita_agendada')],
    totalElements = 2,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockPage = {
      value: signal(content ? { content, totalElements } : undefined),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockPage.reload;

    TestBed.configureTestingModule({
      imports: [LeadsBoard],
      providers: [
        provideRouter([]),
        {
          provide: LeadsService,
          useValue: {
            boardPage: () => mockPage,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsBoard);
    fixture.detectChanges();
  }

  it('should render one column per stage with its count', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    for (const label of [
      'Nuevo',
      'Contactado',
      'Calificado',
      'Cita propuesta',
      'Cita agendada',
      'Cita asistida',
      'Tratamiento propuesto',
      'Tratamiento aceptado',
      'Perdido',
    ]) {
      expect(text).toContain(label);
    }
    expect(text).toContain('2 prospectos en el embudo');
    expect(text).toContain('Lead 1');
    expect(text).toContain('Lead 2');
  });

  it('should show an empty state for stages without leads', () => {
    setup([lead('1', 'nuevo')]);
    const empties = fixture.nativeElement.querySelectorAll('section p');
    expect(empties.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Sin prospectos en esta etapa');
  });

  it('should warn honestly when the board truncates the pipeline', () => {
    setup([lead('1', 'nuevo')], 250);
    expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 250 prospectos');
  });

  it('should regroup instantly when a card reports a move', () => {
    setup([lead('1', 'nuevo')]);
    expect(fixture.componentInstance.grouped().contactado).toHaveLength(0);
    fixture.componentInstance.onMoved({ ...lead('1', 'nuevo'), status: 'contactado' });
    fixture.detectChanges();
    expect(fixture.componentInstance.grouped().nuevo).toHaveLength(0);
    expect(fixture.componentInstance.grouped().contactado.map((item) => item.id)).toEqual(['1']);
  });

  it('should render column skeletons while loading', () => {
    setup(null, 0, true);
    const loading = fixture.nativeElement.querySelector('[data-testid="board-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should explain plan gating instead of showing a broken board', () => {
    setup(null, 0, false, new HttpErrorResponse({ status: 403 }));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('El CRM no está incluido en tu plan');
    expect(fixture.nativeElement.querySelectorAll('section').length).toBe(0);
  });

  it('should show an error with retry on other failures', () => {
    setup(null, 0, false, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los prospectos.');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(reload).toHaveBeenCalled();
  });
});
