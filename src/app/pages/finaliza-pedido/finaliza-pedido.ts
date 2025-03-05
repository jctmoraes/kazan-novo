import { Component } from "@angular/core";
import { Router } from "@angular/router";
import {
  IPedidos,
  mapPedidosGeral,
} from "../../interfaces/pedidos.interface";
import { ITransportadoras } from "@interfaces/transportadoras.interface";
import { UtilProvider } from "@services/util-provider";
import { TransportadorasProvider } from "@services/transportadoras-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { ClienteCadastroProvider } from "@services/cliente-cadastro-provider";
import { IClienteCadastro } from "@interfaces/cliente-cadastro.interface";
import { IPedidosItens } from "@interfaces/pedidosItens.interface";
import { ModalController } from "@ionic/angular";
import { ICondicaoPagto } from "@interfaces/condicaoPagto.interface";
import { AppComponent } from "src/app/app.component";

@Component({
  selector: "page-finaliza-pedido",
  templateUrl: "finaliza-pedido.html",
  styleUrls: ["finaliza-pedido.scss"],
  standalone: false,
})
export class FinalizaPedidoPage {
  _pedido: IPedidos = new IPedidos();
  _lstTransportadoras: ITransportadoras[] = [];
  _valorSubTotal: number = 0;
  _valorSubTotalFormat: string = "";
  _valorIpi: number = 0;
  _valorIpiFormat: string = "";
  _valorSt: number = 0;
  _valorStFormat: string = "";
  _valorTotalFormat: string = "";
  _lstPedidosItens: IPedidosItens[] = [];

  _cliCad: IClienteCadastro[] = [];

  constructor(
    private router: Router,
    private utilProvider: UtilProvider,
    private pedidoProvider: PedidosProvider,
    private cliCadProvider: ClienteCadastroProvider,
    private myApp: AppComponent,
    private modalCtrl: ModalController,
  ) {
    const navigation = this.router.getCurrentNavigation();
    UtilProvider.objPedido.pedidosItens = navigation?.extras?.state['lstPedidosItens'];
    this.calcularTotal();
  }

  calcularTotal() {
    this._valorSubTotal = 0;
    this._valorIpi = 0;
    this._valorSt = 0;
    this._pedido = UtilProvider.objPedido;
    this._lstPedidosItens = UtilProvider.objPedido.pedidosItens;
    //calcular total
    this._lstPedidosItens.forEach((x) => {
      //console.log('vlr', x.valorUnitario);
      this._valorSubTotal += UtilProvider.round(x.valorUnitario) * x.quantidade;
      this._valorIpi += x.valorIpi;
      this._valorSt += x.valorSt;
    });
    this._valorTotalFormat = this.utilProvider.formatarMoeda(
      this._pedido.valor,
    );
    this._valorSubTotalFormat = this.utilProvider.formatarMoeda(
      this._valorSubTotal,
    );
    this._valorIpiFormat = this.utilProvider.formatarMoeda(this._valorIpi);
    this._valorStFormat = this.utilProvider.formatarMoeda(this._valorSt);

    console.log("vai buscar os clientes cadastrados!!!!");
    this.cliCadProvider
      .buscarClientesCad(this._pedido.venCodigo)
      .subscribe((x) => {
        this._cliCad = x;
        console.log("Busca de Clientes Cadastrados; ", this._cliCad);
      });
  }

  async mudarTransportadora() {
    let modal = await this.modalCtrl.create({
      component: "TransportadoraPage",
      componentProps: {
        iniciarPedido: false,
      },
    });
    modal.onDidDismiss().then(async (result) => {
      const transportadora: ITransportadoras = result.data;
      if (transportadora != null) {
        let loading = await this.utilProvider.mostrarCarregando(
          "ATUALIZANDO VALORES...",
        );
        this.calcularTotal();
        this.utilProvider.esconderCarregando(loading);
      }
    });
    modal.present();
  }

  async mudarCondicao() {
    let modal = await this.modalCtrl.create({
      component: "CondicaoPagtoPage",
      componentProps: {
        iniciarPedido: false,
      },
    });
    modal.onDidDismiss().then(async (result) => {
      const condicaoPagto: ICondicaoPagto = result.data;
      //console.log('cond', condicaoPagto);
      if (condicaoPagto != null) {
        let loading = await this.utilProvider.mostrarCarregando(
          "ATUALIZANDO VALORES...",
        );
        this.calcularTotal();
        this.utilProvider.esconderCarregando(loading);
      }
    });
    modal.present();
  }

  salvar() {
    const codFilialFuncLogado = this.myApp.funcionarioLogado.filial.toString();
    const codFilialStorage = localStorage.getItem("codFilialSet");
    const numFilial = parseInt(
      codFilialStorage ? codFilialStorage : codFilialFuncLogado,
    );
    if (this._pedido.valor < this._pedido.condicaoPagto.valMinimo) {
      this.utilProvider.alerta(
        "VALOR ABAIXO DO MÍNIMO",
        "VLR. DO PEDIDO ABAIXO DO VLR. MÍNIMO DA CONDIÇÃO DE PAGTO. VLR. MIN: " +
          this.utilProvider.formatarMoeda(this._pedido.condicaoPagto.valMinimo),
        () => {},
      );
    } else {
      this.utilProvider.alerta(
        "PEDIDO SALVO",
        "PEDIDO SALVO COM SUCESSO",
        () => {},
      );
      this._pedido.valor = parseFloat(this._pedido.valor.toFixed(2));
      const pedidoGeral = mapPedidosGeral(this._pedido, numFilial);
      this.pedidoProvider.salvarPedidoGeral(pedidoGeral).subscribe(() => {
        //this.navCtrl.popToRoot();
        // this.myApp.finalizarPedido();
        this.router.navigate(["/home"]);
        // this.navCtrl.push('PedidoPage', { atualizarMaster: true });
      });
    }
  }

  voltar() {
    this.router.navigate(['..']);
  }
}
