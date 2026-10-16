import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RealizarCompras } from './realizar-compras';

describe('RealizarCompras', () => {
  let component: RealizarCompras;
  let fixture: ComponentFixture<RealizarCompras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealizarCompras],
    }).compileComponents();

    fixture = TestBed.createComponent(RealizarCompras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
