import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon, IconName } from './icon';

const names: ReadonlyArray<IconName> = [
  'x',
  'chevron-down',
  'pencil',
  'trash-2',
  'download',
  'check',
  'eye',
  'eye-off',
  'triangle-alert',
  'layout-dashboard',
  'log-out',
  'users',
];

describe('Icon', () => {
  let fixture: ComponentFixture<Icon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icon],
    }).compileComponents();
    fixture = TestBed.createComponent(Icon);
  });

  for (const name of names) {
    it(`should render the ${name} icon`, () => {
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('ng-icon') as HTMLElement;
      expect(icon).not.toBeNull();
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  }
});
