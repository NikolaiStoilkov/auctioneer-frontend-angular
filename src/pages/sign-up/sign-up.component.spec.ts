import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { SignUpComponent } from './sign-up.component';

describe('SignUpComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
