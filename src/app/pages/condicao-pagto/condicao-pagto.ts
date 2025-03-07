import { Component } from "@angular/core";
import { ICondicaoPagto } from "../../interfaces/condicaoPagto.interface";
import { ChangeDetectorRef } from "@angular/core"; // Importação do ChangeDetectorRef
import { CondicaoPagtoProvider } from "@services/condicaoPagto-provider";
import { IvaProvider } from "@services/iva-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { UtilProvider } from "@services/util-provider";
import { InfiniteScrollCustomEvent, ModalController } from "@ionic/angular";
import { Router, ActivatedRoute } from "@angular/router"; // Importação do Router e ActivatedRoute

@Component({
  selector: "page-condicao-pagto",
  templateUrl: "condicao-pagto.html",
  styleUrls: ["condicao-pagto.scss"],
  standalone: false,
})
export class CondicaoPagtoPage {
  _lstCondicaoPagto: ICondicaoPagto[] = [];
  _pagina: number = -1; //início da páginação
  _qtdPorPagina: number = 30; //quantidade de registros a serem carregandos
  _carregando: boolean = false;
  _filtro: string = "";
  _qtdTotal: number = -1;
  _iniciarPedido: boolean = true;
  _cpgCodigo: string = "";
  _cpgPadrao: ICondicaoPagto = null;

  constructor(
    private router: Router,
    private condicaoPagtoProvider: CondicaoPagtoProvider,
    private ivaProvider: IvaProvider,
    private pedidosItensProvider: PedidosItensProvider,
    private pedidosProvider: PedidosProvider,
    private utilProvider: UtilProvider,
    private cdr: ChangeDetectorRef, // Injeção do ChangeDetectorRef
    private route: ActivatedRoute, // Injeção do ActivatedRoute
    private modalCtrl: ModalController,
  ) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
        this._iniciarPedido = params['iniciarPedido'] === 'true';
        console.log("Iniciar Pedido: ", this._iniciarPedido);
      });

      console.log('UtilProvider.objPedido.cpgCodigo', UtilProvider.objPedido.cpgCodigo);

    this.condicaoPagtoProvider
      .porCodigo(UtilProvider.objPedido.cpgCodigo)
      .subscribe((condicao) => {
        if (condicao != null) {
          this._cpgPadrao = condicao;
          this._cpgCodigo = condicao.codigo;
        }
      });
  }

  pesquisar() {
    this._pagina = -1;
    this._lstCondicaoPagto = [];
    this.proxima();
  }

  proxima() {
    this._carregando = true;
    this._pagina++;
    let inicio = this._pagina * this._qtdPorPagina;
    if (this._pagina == 0) {
      this.condicaoPagtoProvider
        .buscar(this._filtro, 0, 0, true)
        .subscribe((qtdTotal) => {
          this._qtdTotal = Number(qtdTotal);
        });
    }

    this.condicaoPagtoProvider
      .buscar(this._filtro, inicio, this._qtdPorPagina, false)
      .subscribe(
        (retorno: ICondicaoPagto[]) => {
          if (retorno.length > 0) {
            let index = -1;
            if (this._cpgPadrao != null)
              index = retorno.findIndex(
                (x) => x.codigo == this._cpgPadrao.codigo,
              );
            if (index > -1) retorno.splice(index, 1);
            this._lstCondicaoPagto = this._lstCondicaoPagto.concat(retorno);
            this._carregando = false;
          }
          this._carregando = false;
          this.cdr.detectChanges(); // Forçar a detecção de mudanças
        },
        (err) => {
          alert("Erro ao buscar as cond. pagamentos");
        },
      );
  }

  async salvar() {
    if (this._cpgCodigo != "") {
      let loading = await this.utilProvider.mostrarCarregando("SELECIONADO...");
      let condicaoPagto = this._cpgPadrao;
      console.log("Exibe cpgPadrao");
      if (condicaoPagto.codigo == null || condicaoPagto.codigo == undefined) {
      } else {
        if (condicaoPagto.codigo != this._cpgCodigo)
          condicaoPagto = this._lstCondicaoPagto.find(
            (x) => x.codigo == this._cpgCodigo,
          );
      }

      UtilProvider.objPedido.cpgCodigo = condicaoPagto.codigo;
      UtilProvider.objPedido.condicaoPagto = condicaoPagto;
      if (this._iniciarPedido) {
        this.pedidosItensProvider
          .buscar(UtilProvider.objPedido.codigo, false)
          .subscribe((lstPedidosItens) => {
            if (lstPedidosItens != null) {
              UtilProvider.objPedido.pedidosItens = lstPedidosItens;
            }
            UtilProvider.recalcularValorItem(
              this.ivaProvider,
              this.pedidosItensProvider,
            ).then(() => {
              this.utilProvider.esconderCarregando(loading);
              this.router.navigate(["/produtos"]); // Substituição de navCtrl.push por router.navigate
            });
          });
      } else {
        await UtilProvider.recalcularValorItem(
          this.ivaProvider,
          this.pedidosItensProvider,
        );
        this.pedidosProvider.salvar(UtilProvider.objPedido).subscribe(() => {
          this.utilProvider.esconderCarregando(loading);
          this.modalCtrl.dismiss(condicaoPagto);
        });
      }
    } else {
      this.utilProvider.alertaBasico(
        "SELECIONE UMA COND. DE PAGTO",
        2000,
        "center",
      );
    }
  }

  cancelar() {
    this.router.navigate(["/master"]); // Substituição de viewCtrl.dismiss por router.navigate
  }

  keypress(event: { keyCode: number; }) {
    if (event.keyCode == 13) {
      this.pesquisar();
    }
  }

  doInfinite(infiniteScroll: InfiniteScrollCustomEvent) {
    this._carregando = true;
    this.proxima();
    infiniteScroll.target.complete();
  }

  compareWith(o1: number, o2: number): boolean {
    return o1 === o2;
  }
}
