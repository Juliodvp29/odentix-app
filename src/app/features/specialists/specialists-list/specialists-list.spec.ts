import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { SpecialistResponse } from '../specialist-models';
import { SettlementsService } from '../settlements.service';
import { SpecialistsList } from './specialists-list';

const SPECIALISTS: SpecialistResponse[] = [
  {
    id: 'spec-1',
    fullName: 'María Gómez',
    specialty: 'Endodoncia',
    feePercentage: 30,
    paymentTerms: 'Neto 15 días',
  },
  { id: 'spec-2', fullName: 'Jorge Ruiz', feePercentage: 25 },
];

describe('SpecialistsList', () => {
  let fixture: ComponentFixture<SpecialistsList>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(
    specialists: SpecialistResponse[] | null = SPECIALISTS,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockResource = {
      value: signal(specialists),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockResource.reload;

    TestBed.configureTestingModule({
      imports: [SpecialistsList],
      providers: [
        provideRouter([]),
        {
          provide: SettlementsService,
          useValue: {
            specialists: () => mockResource,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialistsList);
    fixture.detectChanges();
  }

  it('should render specialists with fee terms and detail links', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('María Gómez');
    expect(text).toContain('Endodoncia');
    expect(text).toContain('30 %');
    expect(text).toContain('Neto 15 días');
    const link = fixture.nativeElement.querySelector(
      'a[href="/specialists/spec-1"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });

  it('should render an empty state without specialists', () => {
    setup([]);
    expect(fixture.nativeElement.textContent).toContain('Sin especialistas registrados');
  });

  it('should render skeletons while loading', () => {
    setup(null, true);
    const loading = fixture.nativeElement.querySelector('[data-testid="specialists-loading"]');
    expect(loading).not.toBeNull();
    expect(loading.getAttribute('aria-busy')).toBe('true');
  });

  it('should explain plan gating instead of failing', () => {
    setup(null, false, new HttpErrorResponse({ status: 403 }));
    expect(fixture.nativeElement.textContent).toContain(
      'Los especialistas no están incluidos en tu plan',
    );
  });

  it('should retry on other errors', () => {
    setup(null, false, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible cargar los especialistas.',
    );
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(reload).toHaveBeenCalled();
  });
});
