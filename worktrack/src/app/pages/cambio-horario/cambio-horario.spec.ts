import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CambioHorario } from './cambio-horario';

describe('CambioHorario', () => {
  let component: CambioHorario;
  let fixture: ComponentFixture<CambioHorario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CambioHorario],
    }).compileComponents();

    fixture = TestBed.createComponent(CambioHorario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
