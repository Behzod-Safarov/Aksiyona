import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleItemComponentComponent } from './single-item-component.component';

describe('SingleItemComponentComponent', () => {
  let component: SingleItemComponentComponent;
  let fixture: ComponentFixture<SingleItemComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleItemComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleItemComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
