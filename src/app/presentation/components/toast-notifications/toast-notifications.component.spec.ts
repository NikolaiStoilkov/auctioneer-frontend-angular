import { TestBed } from '@angular/core/testing';
import { appConfig } from '@/app.config';
import { ToastNotificationsComponent } from './toast-notifications.component';

describe('ToastNotificationsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastNotificationsComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ToastNotificationsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
