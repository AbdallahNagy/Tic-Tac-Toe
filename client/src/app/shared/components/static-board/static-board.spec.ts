import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaticBoard } from './static-board';

describe('StaticBoard', () => {
  let component: StaticBoard;
  let fixture: ComponentFixture<StaticBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaticBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(StaticBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
