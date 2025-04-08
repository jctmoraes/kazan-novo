import { ModalController, Platform } from '@ionic/angular';
import { Component } from '@angular/core';
import { IPedidos } from '../../interfaces/pedidos.interface';
import { IPedidosItens } from '../../interfaces/pedidosItens.interface';
import { IClienteCadastro } from '../../interfaces/cliente-cadastro.interface';
import { UtilProvider } from '@services/util-provider';
import { CondicaoPagtoProvider } from '@services/condicaoPagto-provider';
import { TransportadorasProvider } from '@services/transportadoras-provider';
import { PedidosItensProvider } from '@services/pedidos-itens-provider';
import { Router } from '@angular/router';
import { AbstractModalComponent } from 'src/app/components/modal/abstract-modal.component';

@Component({
  selector: 'app-pedido-detalhe',
  templateUrl: 'pedido-detalhe.html',
  styleUrls: ['pedido-detalhe.scss'],
  standalone: false,
})
export class PedidoDetalhePage extends AbstractModalComponent {
  _pedido: IPedidos = null;
  _transportadora: string = '';
  _condicaoPagto: string = '';
  _valorSubTotalFormat: string = '';
  _cupomDescontoPorcentagemFormat: string = '';
  _valorIpiFormat: string = '';
  _valorStFormat: string = '';
  _valorTotalFormat: string = '';
  _status: string = '';
  _lstPedidosItens: IPedidosItens[] = [];

  _cliCad: IClienteCadastro[] = [];

  constructor(
    private router: Router,
    private pedidoItensProvider: PedidosItensProvider,
    private transportadoraProvider: TransportadorasProvider,
    private condicaoPagto: CondicaoPagtoProvider,
    public utilProvider: UtilProvider,
    modalCtrl: ModalController,
    platform: Platform
  ) {
    super(modalCtrl, platform);
  }

  async ionViewDidEnter() {
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { pedido: IPedidos };
    this._pedido = componentProps?.pedido;

    if (this._pedido.status == 1) {
      this._status = 'NÃO ENVIADO';
    } else {
      this._status = 'ENVIADO';
    }
    this.pedidoItensProvider
      .buscar(this._pedido.codigo, false)
      .subscribe(lstPedidosItens => {
        this._lstPedidosItens = lstPedidosItens;
        this._pedido.valorSubTotal = 0;
        this._pedido.valorIpi = 0;
        this._pedido.valorSt = 0;
        this._lstPedidosItens.forEach(x => {
          let valor = UtilProvider.round(x.valor);
          valor = UtilProvider.round(valor);
          valor *= x.quantidade;
          this._pedido.valorSubTotal += valor;
          this._pedido.valorIpi += x.valorIpi;
          this._pedido.valorSt += x.valorSt;
        });
        this._valorSubTotalFormat = this.utilProvider.formatarMoeda(
          this._pedido.valorSubTotal
        );
        this._valorIpiFormat = this.utilProvider.formatarMoeda(
          this._pedido.valorIpi
        );
        this._valorStFormat = this.utilProvider.formatarMoeda(
          this._pedido.valorSt
        );
        this._cupomDescontoPorcentagemFormat = this.utilProvider.formatarPorcentagem(
          this._pedido.porcentagemCupomDesconto
        );
        this._valorTotalFormat = this.utilProvider.formatarMoeda(
          this._pedido.valor
        );
      });
    this.transportadoraProvider
      .porCodigo(this._pedido.traCodigo)
      .subscribe(retorno => {
        this._transportadora = retorno.nome;
      });
    this.condicaoPagto.porCodigo(this._pedido.cpgCodigo).subscribe(retorno => {
      this._condicaoPagto = retorno.descricao;
    });
  }

  sair() {
    this.router.navigate(['..']);
  }

}
