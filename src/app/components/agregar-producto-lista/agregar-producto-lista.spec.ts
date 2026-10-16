import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarProductoLista } from './agregar-producto-lista';

describe('AgregarProductoLista', () => {
  let component: AgregarProductoLista;
  let fixture: ComponentFixture<AgregarProductoLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarProductoLista],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarProductoLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
