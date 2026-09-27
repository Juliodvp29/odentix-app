import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon, IconName } from './icon';

const names: ReadonlyArray<IconName> = [
  'x',
  'calendar',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'search',
  'stethoscope',
  'target',
  'refresh',
  'pencil',
  'package',
  'plus',
  'trash-2',
  'download',
  'check',
  'eye',
  'eye-off',
  'file-text',
  'triangle-alert',
  'layout-dashboard',
  'lock',
  'log-out',
  'users',
  'wallet',
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
