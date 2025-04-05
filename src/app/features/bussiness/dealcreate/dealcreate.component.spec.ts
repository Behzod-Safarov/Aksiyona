import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealcreateComponent } from './dealcreate.component';

describe('DealcreateComponent', () => {
  let component: DealcreateComponent;
  let fixture: ComponentFixture<DealcreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealcreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealcreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
