import { TestBed } from '@angular/core/testing';
import { appConfig } from '@/app.config';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
