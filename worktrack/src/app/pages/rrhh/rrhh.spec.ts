import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Rrhh } from './rrhh';

@Component({
  standalone: true,
  template: '',
})
class TestLoginComponent {}

describe('Rrhh', () => {
  let component: Rrhh;
  let fixture: ComponentFixture<Rrhh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rrhh],
      providers: [
        provideRouter([
          {
            path: 'login',
            component: TestLoginComponent,
          },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Rrhh);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
