import { TestBed } from '@angular/core/testing';
import { appConfig } from '@/app.config';
import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignInComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
