import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IPedidosItens } from '@interfaces/pedidosItens.interface';
import { IItens } from '@interfaces/itens.interface';
import { PedidosItensProvider } from '@services/pedidos-itens-provider';
import { UtilProvider } from '@services/util-provider';
import { PedidosProvider } from '@services/pedidos-provider';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carrinho',
  templateUrl: 'carrinho.html',
  styleUrls: ['carrinho.scss'],
  standalone: false,
})
export class CarrinhoPage {
  _lstPedidosItens: IPedidosItens[] = [];
  _total: number = 0;
  _estado: string = '';

  constructor(
    private router: Router,
    public pedidoItens: PedidosItensProvider,
    private pedido: PedidosProvider,
    public util: UtilProvider,
    private modalCtrl: ModalController) {
  }

  ionViewWillEnter(): void {
    //console.log('ionViewWillEnter', UtilProvider.objPedido.pedidosItens.length);
    this._lstPedidosItens = UtilProvider.objPedido.pedidosItens;
    this._total = UtilProvider.objPedido.valor;
  }

  editar(pedidoItens: IPedidosItens): void {
    this.addProduto(pedidoItens.item!, pedidoItens);
  }

  excluir(pedidoItens: IPedidosItens): void {
    this.excluirProduto(pedidoItens);
  }

  async addProduto(item: IItens, pedidoItens: IPedidosItens = null): Promise<void> {
    //console.log('item', JSON.stringify(item));
    //se adição
    if (pedidoItens == null) {
      //verificar se o produto já foi add
      pedidoItens = this._lstPedidosItens.find(x => x.iteCodigo == item.codigo);
    }
    let modal = await this.modalCtrl.create({
      component: 'ProdutoQtdPage',
      componentProps: {
        item: item,
        pedidoItens: pedidoItens,
        estado: this._estado
      }
    });
    modal.onDidDismiss().then((result) => {
      const pedidoItens: IPedidosItens = result.data;
      //console.log('pedidoItens', pedidoItens);
      if (pedidoItens != null) {
        let index = this._lstPedidosItens.findIndex(x => x.sequencia == pedidoItens.sequencia
          && x.pedCodigo == pedidoItens.pedCodigo);
        if (index > -1) {
          this._lstPedidosItens.splice(index, 1);
        }
        this._lstPedidosItens.splice(0, 0, pedidoItens);
        this._total = this.util.calcularTotalPedido(this._lstPedidosItens);
        this.salvarPedido();
      }
    });
    modal.present();
  }

  async excluirProduto(pedidoItens: IPedidosItens): Promise<void> {
    await this.util.confirmacao('DESEJA EXCLUIR O ITEM <b>' + pedidoItens.item.nome + '</b>', 'CONFIRMAÇÃO DE EXCLUSÃO', () => {
      this.pedidoItens.excluir(pedidoItens.pedCodigo, pedidoItens.sequencia).subscribe(
        () => {
          let index = this._lstPedidosItens.findIndex(x => x.sequencia == pedidoItens.sequencia
            && x.pedCodigo == pedidoItens.pedCodigo);
          if (index > -1) {
            this._lstPedidosItens.splice(index, 1);
          }
          this._total = this.util.calcularTotalPedido(this._lstPedidosItens);
          this.salvarPedido();
          //apagar o pedido
          // if(this._lstPedidosItens.length == 0) {
          //   this.pedido.excluir()
          // }
        }
      );
    });
  }

  salvarPedido(): void {
    UtilProvider.objPedido.valor = this._total;
    UtilProvider.objPedido.dtAlteracao = new Date();
    this.pedido.salvar(UtilProvider.objPedido).subscribe(
      () => { }
    );
  }

  finalizarPedido(): void {
    if (this._lstPedidosItens.length > 0) {
      this.router.navigate(['/finaliza-pedido'], { state: { lstPedidosItens: this._lstPedidosItens } });
    } else {
      this.util.alerta('CARRINHO VAZIO', 'ADICIONE AO MENOS UM PRODUTO PARA EFETUAR O PEDIDO', () => { });
    }
  }
}
