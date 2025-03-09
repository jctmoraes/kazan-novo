import { Component } from '@angular/core';
import { IPedidosFiltro } from "../../../interfaces/filtro/pedidos-filtro.interface";
import { IClientes } from "../../../interfaces/clientes.interface";
import { ModalController, NavParams, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { AbstractModalComponent } from 'src/app/components/modal/abstract-modal.component';
import { ClienteSelecionaPage } from '../../cliente-seleciona/cliente-seleciona';

@Component({
  selector: 'app-pedido-filtro',
  templateUrl: 'pedido-filtro.html',
  styleUrls: ['pedido-filtro.scss'],
  standalone: false,
})
export class PedidoFiltroPage extends AbstractModalComponent {
  _buscar = false;
  _filtro: IPedidosFiltro = new IPedidosFiltro();

  constructor(
    private router: Router,
    modalCtrl: ModalController,
    platform: Platform

  ) {
    super(modalCtrl, platform);
    if (this._filtro.cliCodigo == 0)
      this._filtro.cliNome = 'TODOS OS CLIENTES';
  }

  async selecionarCliente() {
    let modal = await this.modalCtrl.create({
      component: ClienteSelecionaPage
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
    this.fechar();
  }
}
