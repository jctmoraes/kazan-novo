import { Component } from '@angular/core';
import { IPedidos } from '@interfaces/pedidos.interface';
import { PedidoEmailProvider } from '@services/pedido-email.provider';
import { PedidosItensProvider } from '@services/pedidos-itens-provider';
import { PedidosProvider } from '@services/pedidos-provider';
import { UtilProvider } from '@services/util-provider';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pedido-planilha',
  templateUrl: 'pedido-planilha.html',
  styleUrls: ['pedido-planilha.scss'],
  standalone: false,
})
export class PedidoPlanilhaPage {
  _planilha = '';
  _pedido: IPedidos = null;
  _email: string = '';

  constructor(
    private router: Router,
    private pedidoEmailProvider: PedidoEmailProvider,
    private utilProvider: UtilProvider,
    private pedidoProvider: PedidosProvider,
    private pedidoItensProvider: PedidosItensProvider
  ) {
    const navigation = this.router.getCurrentNavigation();
    this._pedido = navigation?.extras?.state['pedido'];

    try {
      this.pedidoEmailProvider.buscarPlanilha(this._pedido.cliCodigo).subscribe(
        (retorno) => {
          if (retorno != null) {
            this._planilha = retorno;
          } else {
            this._planilha = this._pedido.cliente.email;
          }
        },
        (err) => {
          console.error('Erro ao buscar planilha:', err);
        }
      );
    } catch (error) {
      console.error('Erro no construtor:', error);
    }
  }

  enviar() {
    this.pedidoEmailProvider.salvarPlanilha(this._pedido.cliCodigo, this._planilha).subscribe(
      async () => {
        let loading = await this.utilProvider.mostrarCarregando('ENVIANDO...');

        this.pedidoItensProvider.buscar(this._pedido.codigo, false).subscribe(
          (lstPedidosItens) => {
            this._pedido.pedidosItens = lstPedidosItens;
            this._pedido.valorSubTotal = 0;
            this._pedido.valorIpi = 0;
            this._pedido.valorSt = 0;
            this._pedido.baseSt = 0;
            this._pedido.valorDesconto = 0;

            lstPedidosItens.forEach(x => {
              this._pedido.valorSubTotal += UtilProvider.round(x.valor) * x.quantidade;
              this._pedido.valorIpi += x.valorIpi;
              this._pedido.valorSt += x.valorSt;
              this._pedido.baseSt += x.baseSt;
              this._pedido.valorDesconto += x.desconto;
            });

            this._pedido['pedidoEmail'] = this._planilha;
            this._pedido.emailInformado = this._email;

            this.pedidoProvider.sincronizar(this._pedido, false, true).subscribe(
              () => {
                this.utilProvider.alerta('PEDIDO ENVIADO', 'PEDIDO ENVIADO COM SUCESSO!', () => { });
                this.utilProvider.esconderCarregando(loading);
                this.cancelar();
              },
              err => {
                console.error('Erro ao sincronizar pedido:', err);
                this.utilProvider.alerta('Ops, ocorreu um erro', 'Erro ao enviar o pedido: ' + err.message, null);
                this.utilProvider.esconderCarregando(loading);
              }
            );
          },
          err => {
            console.error('Erro ao buscar itens do pedido:', err);
            this.utilProvider.esconderCarregando(loading);
          }
        );
      },
      err => {
        console.error('Erro ao salvar planilha:', err);
      }
    );
  }

  cancelar() {
    console.log('Cancelando operação.');
    this.router.navigate(['..']);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PedidoPlanilhaPage');
  }
}
