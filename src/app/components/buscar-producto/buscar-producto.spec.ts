import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuscarProducto } from './buscar-producto';

describe('BuscarProducto', () => {
  let component: BuscarProducto;
  let fixture: ComponentFixture<BuscarProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscarProducto],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscarProducto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
