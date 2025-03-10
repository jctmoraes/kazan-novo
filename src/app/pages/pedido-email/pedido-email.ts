import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { IPedidos } from "@interfaces/pedidos.interface";
import { ModalController, Platform } from "@ionic/angular";
import { FotosProvider } from "@services/fotos-provider";
import { PedidoEmailProvider } from "@services/pedido-email.provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { UtilProvider } from "@services/util-provider";
import { AbstractModalComponent } from "src/app/components/modal/abstract-modal.component";

@Component({
  selector: "page-pedido-email",
  templateUrl: "pedido-email.html",
  styleUrls: ["pedido-email.scss"],
  standalone: false,
})
export class PedidoEmailPage extends AbstractModalComponent {
  _email = "";
  _pedido: IPedidos = null;

  constructor(
    private router: Router,
    private pedidoEmailProvider: PedidoEmailProvider,
    private utilProvider: UtilProvider,
    private fotosProvider: FotosProvider,
    private pedidoProvider: PedidosProvider,
    private pedidoItensProvider: PedidosItensProvider,
    modalCtrl: ModalController,
    platform: Platform
  ) {
    super(modalCtrl, platform);
  }

  async ionViewDidEnter() {
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { pedido: IPedidos };
    console.log('componentProps', componentProps);
    this._pedido = componentProps?.pedido;

    this.pedidoEmailProvider.buscar(this._pedido.cliCodigo).subscribe((retorno) => {
      if (retorno != null) this._email = retorno;
      else this._email = this._pedido.cliente.email;
    });
  }

  async enviar() {
    let loading;
    try {
      await this.pedidoEmailProvider
        .salvar(this._pedido.cliCodigo, this._email)
        .toPromise();

      loading = await this.utilProvider.mostrarCarregando("ENVIANDO...");

      const lstPedidosItens = await this.pedidoItensProvider
        .buscar(this._pedido.codigo, false)
        .toPromise();
      this._pedido.pedidosItens = lstPedidosItens;
      this._pedido.valorSubTotal = 0;
      this._pedido.valorIpi = 0;
      this._pedido.valorSt = 0;
      this._pedido.baseSt = 0;
      this._pedido.valorDesconto = 0;

      let fotoCount = 0; // Contador para fotos

      for (const x of lstPedidosItens) {
        let fotos = await this.fotosProvider.buscar(x.iteCodigo).toPromise();
        if (fotos == null && this.utilProvider.internetConectada()) {
          fotos = await this.fotosProvider.sincronizar(x.iteCodigo).toPromise();
        }
        if (fotoCount < 40) {
          x.imagePDF = fotos.imagem1;
          fotoCount++; // Incrementa o contador de fotos
        }
        this._pedido.valorSubTotal +=
          UtilProvider.round(x.valor) * x.quantidade;
        this._pedido.valorIpi += x.valorIpi;
        this._pedido.valorSt += x.valorSt;
        this._pedido.baseSt += x.baseSt;
        this._pedido.valorDesconto += x.desconto;
      }

      this._pedido["pedidoEmail"] = this._email;
      this._pedido["emailInformado"] = this._pedido["cliente"]["email"];
      await this.pedidoProvider
        .sincronizar(this._pedido, true, false)
        .toPromise();

      this.utilProvider.alerta(
        "PEDIDO ENVIADO",
        "PEDIDO ENVIADO COM SUCESSO!",
        () => {}
      );
      this.utilProvider.esconderCarregando(loading);
      this.fechar();
    } catch (err) {
      this.utilProvider.alerta(
        "Ops, ocorreu um erro",
        "Erro ao enviar o pedido: " + err,
        null
      );
      this.utilProvider.esconderCarregando(loading);
    }
  }
}
