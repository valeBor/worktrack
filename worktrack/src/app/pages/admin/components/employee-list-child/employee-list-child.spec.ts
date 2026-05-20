import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeListChild } from './employee-list-child';

describe('EmployeeListChild', () => {
  let component: EmployeeListChild;
  let fixture: ComponentFixture<EmployeeListChild>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeListChild],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeListChild);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
