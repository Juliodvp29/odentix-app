import { TestBed } from '@angular/core/testing';
import { Placeholder } from '@features/placeholder/placeholder';

describe('Placeholder', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Placeholder],
    }).compileComponents();
  });

  it('should create the placeholder', () => {
    const fixture = TestBed.createComponent(Placeholder);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
