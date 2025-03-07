import { IFaixaDescontos } from '../../interfaces/faixaDescontos';
import { Component, Inject } from '@angular/core';
import { IPedidosItens } from "../../interfaces/pedidosItens.interface";
import { IItens } from "../../interfaces/itens.interface";
import { IFuncionarios } from '../../interfaces/funcionarios.interface';
import { UtilProvider } from '@services/util-provider';
import { PedidosProvider } from '@services/pedidos-provider';
import { PedidosItensProvider } from '@services/pedidos-itens-provider';
import { IvaProvider } from '@services/iva-provider';
import { FuncionariosProvider } from '@services/funcionarios-provider';
import { FaixaDescontosProvider } from '@services/faixaDescontos-provider';
import { Router } from '@angular/router';
import { AbstractModalComponent } from 'src/app/components/modal/abstract-modal.component';
import { ModalController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-produto-qtd',
  templateUrl: 'produto-qtd.html',
  styleUrls: ['produto-qtd.scss'],
  standalone: false,
})
export class ProdutoQtdPage extends AbstractModalComponent {
  _totalAnterior: number = 0;
  _pedidoItens: IPedidosItens = new IPedidosItens();
  _item: IItens = new IItens();
  _valorFormat: string = '';
  _valorUnitarioFormat: string = '';
  _totalFormat: string = '';
  _valorIpiFormat: string = '';
  _valorStFormat: string = '';
  _funcionario: IFuncionarios = null;
  _faixaDesconto: IFaixaDescontos = null;

  constructor(
    public utilProvider: UtilProvider,
    private pedidoProvider: PedidosProvider,
    private pedidoItensProvider: PedidosItensProvider,
    private ivaProvider: IvaProvider,
    private funcionarioProvider: FuncionariosProvider,
    private faixaDescontosProvider: FaixaDescontosProvider,
    private router: Router,
    modalCtrl: ModalController,
    platform: Platform,
  ) {
    super(modalCtrl, platform);
  }

  async ionViewDidEnter() {
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { pedidoItens: IPedidosItens };
    console.log('componentProps', componentProps);
    const pedidoItens = componentProps?.pedidoItens;
    console.log('pedidoItens', pedidoItens);
    this.funcionarioProvider.buscarLogado().subscribe(
      (retorno) => {
        this._funcionario = retorno;
      }
    );
    this.pedidoItensProvider.porCodigo(pedidoItens.pedCodigo, pedidoItens.iteCodigo).subscribe(
      (retorno) => {
        retorno.item = pedidoItens.item;
        this._item = retorno.item;
        this._pedidoItens = retorno;
        this._totalAnterior = pedidoItens.total;
        this.formatarValor();
      }
    );
  }

  async change() {
    await this.calcularTotal();
  }

  doTeste() {
    //console.log('Teste-->', JSON.stringify(this._faixaDesconto));
  }

  calcularTotal(): Promise<boolean> {
    /* let aux;
    const faixa = this.faixaDescontosProvider.buscarFaixa(UtilProvider.objPedido.valor, this._funcionario.filial).subscribe((faixa) => {
      console.log('total:::', UtilProvider.objPedido.valor);
      console.log('faixa==', faixa);
      this._faixaDesconto = faixa;
      aux = faixa;
      this.doTeste();

    });
    console.log('faixa de desconto:::::', this._faixaDesconto); */


    return new Promise(resolve => {
      // if(this._pedidoItens.quantidade.toString() == '' || this._pedidoItens.quantidade == 0) {
      //   this._pedidoItens.quantidade = 1;
      // }
      this._pedidoItens.quantidade = this.utilProvider.validarQuantidade(this._pedidoItens.quantidade.toString(), this._pedidoItens.item.qtdMax, this._funcionario.estado);
      if (this._pedidoItens.desconto.toString() == '' || this._pedidoItens.desconto < 0) {
        this._pedidoItens.desconto = 0;

      }
      else {
        // this._funcionario.filial
        this.faixaDescontosProvider.buscarFaixa(UtilProvider.objPedido.valor, this._funcionario.filial).subscribe((fx) => {

          console.log('**** faixa descontos: ', fx);
          if (fx !== null) {
            console.log('valor do pedido --> ', UtilProvider.objPedido.valor);
            console.log('valor desonto ---> ', this._pedidoItens.desconto);

            const desc = (UtilProvider.objPedido.valor * this._pedidoItens.desconto) / 100;
            const valPed = UtilProvider.objPedido.valor - desc;

            console.log('desc ---> ', desc);
            console.log('valped ---->', valPed);

            if (this._pedidoItens.item.descLimite == null) {
              this._pedidoItens.item.descLimite = 0;
            }
            if ((valPed < fx.valde) && fx !== undefined) {
              this._pedidoItens.desconto = 0;
              this.utilProvider.alerta('DESCONTO MAIOR QUE A FAIXA', 'O VALOR MINÍMO É R$ ' + fx.valde, null);
              return;
            }
            if (this._pedidoItens.desconto > this._pedidoItens.item.descLimite) {
              this._pedidoItens.desconto = 0;
              this.utilProvider.alerta('DESCONTO MAIOR QUE O LIMITE', 'O LIMITE DE DESCONTO É ' + this._pedidoItens.item.descLimite + '%', null);
              return;
            }

            this._pedidoItens.valorUnitario = UtilProvider.calcularValorItem(this._pedidoItens.valor - UtilProvider.round(this._pedidoItens.valor * this._pedidoItens.desconto / 100), this._pedidoItens.item.fabCodigo);
            this.ivaProvider.buscar(this._pedidoItens.item.claFiscal).subscribe(
              (iva) => {
                let retorno = UtilProvider.calcularSt(this._pedidoItens.valorUnitario * this._pedidoItens.quantidade, this._pedidoItens.item.fabCodigo, this._pedidoItens.item.codTributacao, this._pedidoItens.item.ipi, iva, this._pedidoItens.item.codCest);
                this._pedidoItens.valorIpi = retorno.valorIpi;
                this._pedidoItens.valorSt = retorno.valorSt;
                this._pedidoItens.total = (this._pedidoItens.valorUnitario * this._pedidoItens.quantidade) + retorno.valorIpi + retorno.valorSt;
                this.formatarValor();
                resolve(true);
              }
            );
          } else {

            console.log('valor do pedido --> ', UtilProvider.objPedido.valor);
            console.log('valor desonto ---> ', this._pedidoItens.desconto);

            const desc = (UtilProvider.objPedido.valor * this._pedidoItens.desconto) / 100;
            const valPed = UtilProvider.objPedido.valor - desc;

            console.log('desc ---> ', desc);
            console.log('valped ---->', valPed);

            if (this._pedidoItens.desconto > this._pedidoItens.item.descLimite) {
              this._pedidoItens.desconto = 0;
              this.utilProvider.alerta('DESCONTO MAIOR QUE O LIMITE', 'O LIMITE DE DESCONTO É ' + this._pedidoItens.item.descLimite + '%', null);
              return;
            }

            this._pedidoItens.valorUnitario = UtilProvider.calcularValorItem(this._pedidoItens.valor - UtilProvider.round(this._pedidoItens.valor * this._pedidoItens.desconto / 100), this._pedidoItens.item.fabCodigo);
            this.ivaProvider.buscar(this._pedidoItens.item.claFiscal).subscribe(
              (iva) => {

                let retorno = UtilProvider.calcularSt(this._pedidoItens.valorUnitario * this._pedidoItens.quantidade, this._pedidoItens.item.fabCodigo, this._pedidoItens.item.codTributacao, this._pedidoItens.item.ipi, iva, this._pedidoItens.item.codCest);
                this._pedidoItens.valorIpi = retorno.valorIpi;
                this._pedidoItens.valorSt = retorno.valorSt;
                this._pedidoItens.total = (this._pedidoItens.valorUnitario * this._pedidoItens.quantidade) + retorno.valorIpi + retorno.valorSt;
                this.formatarValor();
                resolve(true);
              }
            );
          }
        });

      }
      /* this._pedidoItens.valorUnitario = UtilProvider.calcularValorItem(this._pedidoItens.valor - UtilProvider.round(this._pedidoItens.valor * this._pedidoItens.desconto / 100), this._pedidoItens.item.fabCodigo);
      this.ivaProvider.buscar(this._pedidoItens.item.claFiscal).subscribe(
        (iva) => {
          console.log('===============');
          let retorno = UtilProvider.calcularSt(this._pedidoItens.valorUnitario * this._pedidoItens.quantidade, this._pedidoItens.item.fabCodigo, this._pedidoItens.item.codTributacao, this._pedidoItens.item.ipi, iva, this._pedidoItens.item.codCest);
          this._pedidoItens.valorIpi = retorno.valorIpi;
          this._pedidoItens.valorSt = retorno.valorSt;
          this._pedidoItens.total = (this._pedidoItens.valorUnitario * this._pedidoItens.quantidade) + retorno.valorIpi + retorno.valorSt;
          this.formatarValor();
          resolve(true);
        }
      ); */
    });
  }

  formatarValor() {
    this._valorFormat = this.utilProvider.formatarMoeda(this._pedidoItens.valor);
    this._valorUnitarioFormat = this.utilProvider.formatarMoeda(this._pedidoItens.valorUnitario);
    this._totalFormat = this.utilProvider.formatarMoeda(this._pedidoItens.total);
    //console.log('valorIpi', this._pedidoItens.valorIpi);
    this._valorIpiFormat = this.utilProvider.formatarMoeda(this._pedidoItens.valorIpi);
    this._valorStFormat = this.utilProvider.formatarMoeda(this._pedidoItens.valorSt);
  }

  async salvar() {
    await this.calcularTotal();
    //console.log('salvar');
    this.pedidoItensProvider.salvar(this._pedidoItens).subscribe(
      () => {
        UtilProvider.objPedido.valor -= this._totalAnterior;
        UtilProvider.objPedido.valor += this._pedidoItens.total;
        this.pedidoProvider.salvar(UtilProvider.objPedido).subscribe(
          (retorno) => {
            this.utilProvider.alertaBasico('PRODUTO ALTERADO');
          }
        );
        this.fechar(this._pedidoItens);
      }
    );
  }
}
