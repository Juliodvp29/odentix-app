import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ComingSoon } from './coming-soon';

describe('ComingSoon', () => {
  let fixture: ComponentFixture<ComingSoon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComingSoon],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { title: 'Pacientes' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ComingSoon);
    fixture.detectChanges();
  });

  it('should render the module title from route data', () => {
    expect(fixture.nativeElement.textContent).toContain('Pacientes');
    expect(fixture.nativeElement.textContent).toContain('Módulo en construcción');
  });
});
