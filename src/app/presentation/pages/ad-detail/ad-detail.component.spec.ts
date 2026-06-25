import { TestBed } from '@angular/core/testing';
import { appConfig } from '@/app.config';
import { AdDetailComponent } from './ad-detail.component';

describe('AdDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdDetailComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
