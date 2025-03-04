import { Component } from '@angular/core';
import { IPedidosFiltro } from "../../../interfaces/filtro/pedidos-filtro.interface";
import { IClientes } from "../../../interfaces/clientes.interface";
import { ModalController, NavParams } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pedido-filtro',
  templateUrl: 'pedido-filtro.html',
  styleUrls: ['pedido-filtro.scss'],
  standalone: false,
})
export class PedidoFiltroPage {
  _buscar = false;
  _filtro: IPedidosFiltro = new IPedidosFiltro();

  constructor(
    private router: Router,
    public navParams: NavParams,
    public modalCtrl: ModalController
  ) {
    this._filtro = navParams.get('filtro');
    if (this._filtro.cliCodigo == 0)
      this._filtro.cliNome = 'TODOS OS CLIENTES';
  }

  async selecionarCliente() {
    let modal = await this.modalCtrl.create({
      component: 'ClienteSelecionaPage'
    });
    modal.onDidDismiss().then((result) => {
      const cliente: IClientes = result.data;
      if (cliente != null) {
        this._filtro.cliCodigo = cliente.codigo;
        this._filtro.cliNome = cliente.nome;
      }
    });
    modal.present();
  }

  pesquisar() {
    this._buscar = true;
    this.sair();
  }

  sair() {
    this.router.navigate(['/previous-page'], { state: { buscar: this._buscar, filtro: this._filtro } });
  }
}
