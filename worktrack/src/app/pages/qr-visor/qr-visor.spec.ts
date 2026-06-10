import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrVisor } from './qr-visor';

describe('QrVisor', () => {
  let component: QrVisor;
  let fixture: ComponentFixture<QrVisor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrVisor],
    }).compileComponents();

    fixture = TestBed.createComponent(QrVisor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
