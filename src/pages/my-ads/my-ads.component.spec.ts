import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { MyAdsComponent } from './my-ads.component';

describe('MyAdsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAdsComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MyAdsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
