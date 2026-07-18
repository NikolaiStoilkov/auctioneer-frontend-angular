import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { AddCreditsComponent } from './add-credits.component';

describe('AddCreditsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCreditsComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AddCreditsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
