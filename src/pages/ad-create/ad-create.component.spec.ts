import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { AdCreateComponent } from './ad-create.component';

describe('AdCreateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdCreateComponent],
      providers: [...appConfig.providers],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdCreateComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
