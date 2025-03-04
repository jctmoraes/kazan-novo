import { Component } from '@angular/core';
import { IClientes } from "../../interfaces/clientes.interface";
import { UtilProvider } from '@services/util-provider';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente-detalhe',
  templateUrl: 'cliente-detalhe.html',
  styleUrls: ['cliente-detalhe.scss'],
  standalone: false,
})
export class ClienteDetalhePage {
  _cliente: IClientes = new IClientes();

  constructor(
    private router: Router,
    public util: UtilProvider
  ) {
    const navigation = this.router.getCurrentNavigation();
    this._cliente = navigation?.extras?.state['cliente'];
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad ClienteDetalhePage');
  }

  protected sair() {
    this.router.navigate(['..']);
  }
}
