import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrAdmin } from './qr-admin';

describe('QrAdmin', () => {
  let component: QrAdmin;
  let fixture: ComponentFixture<QrAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(QrAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
