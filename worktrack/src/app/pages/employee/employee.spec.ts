import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Employee } from './employee';

@Component({
  standalone: true,
  template: '',
})
class TestLoginComponent {}

describe('Employee', () => {
  let component: Employee;
  let fixture: ComponentFixture<Employee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employee],
      providers: [
        provideRouter([
          {
            path: 'login',
            component: TestLoginComponent,
          },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Employee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
