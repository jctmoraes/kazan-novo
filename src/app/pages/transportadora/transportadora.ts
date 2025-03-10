import { Component } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { ITransportadoras } from "@interfaces/transportadoras.interface";
import { InfiniteScrollCustomEvent, ModalController, Platform } from "@ionic/angular";
import { IvaProvider } from "@services/iva-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { TransportadorasProvider } from "@services/transportadoras-provider";
import { UtilProvider } from "@services/util-provider";

@Component({
  selector: "page-transportadora",
  templateUrl: "transportadora.html",
  styleUrls: ["transportadora.scss"],
  standalone: false,
})
export class TransportadoraPage {
  _lstTransportadoras: ITransportadoras[] = [];
  _pagina: number = -1;
  _qtdPorPagina: number = 30;
  _carregando: boolean = false;
  _filtro: string = "";
  _qtdTotal: number = -1;
  _iniciarPedido: boolean = true;
  _editarPedido: boolean = false;
  _traPadrao: ITransportadoras | null = null;
  _traCodigo: number = 0;

  constructor(
    private router: Router,
    private transportadoraProvider: TransportadorasProvider,
    private pedidosProvider: PedidosProvider,
    private pedidosItensProvider: PedidosItensProvider,
    private ivaProvider: IvaProvider,
    private utilProvider: UtilProvider,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
  ) {
  }

  ngOnInit() {
    this._iniciarPedido = this.route.snapshot.queryParamMap.get('iniciarPedido') as unknown as boolean;
    this._editarPedido = this.route.snapshot.queryParamMap.get('editarPedido') as unknown as boolean;
    console.log("Iniciar _editarPedido: ", this._editarPedido);
    if (!UtilProvider.objPedido?.traCodigo) {
      return;
    }
    this.transportadoraProvider
      .porCodigo(UtilProvider.objPedido.traCodigo)
      .subscribe((transportadora) => {
        if (transportadora != null) {
          this._traCodigo = transportadora.codigo;
          this._traPadrao = transportadora;
          this.cdr.detectChanges(); // Força a atualização na interface
        }
      });
  }

  pesquisar() {
    this._pagina = -1;
    this._lstTransportadoras = [];
    this.proxima();
  }

  proxima() {
    this._carregando = true;
    this._pagina++;
    let inicio = this._pagina * this._qtdPorPagina;
    if (this._pagina == 0) {
      this.transportadoraProvider
        .buscar(this._filtro, 0, 0, true)
        .subscribe((qtdTotal) => {
          this._qtdTotal = Number(qtdTotal);
        });
    }

    this.transportadoraProvider
      .buscar(this._filtro, inicio, this._qtdPorPagina, false)
      .subscribe(
        (retorno: ITransportadoras[]) => {
          if (retorno.length > 0) {
            let index = -1;
            if (this._traPadrao != null)
              index = retorno.findIndex(
                (x) => x.codigo == this._traPadrao!.codigo,
              );
            if (index > -1) {
              retorno.splice(index, 1);
            }
            this._lstTransportadoras = this._lstTransportadoras.concat(retorno);
          }
          this._carregando = false;
          this.cdr.detectChanges(); // Força a atualização após carregar os dados
        },
        (err) => {
          alert("Erro ao buscar as transportadoras");
        },
      );
  }

  // Este é o método que deve ser chamado pelo evento ionChange
  onTransportadoraChange(event: any) {
    console.log("Evento ionChange detectado:", event);
    console.log("Evento ionChange detectado:", event.targe.value);
    this._traCodigo = event.target.value;
    this.cdr.detectChanges(); // Força a atualização imediata da interface
  }

  async salvar() {
    console.log("Transportadora selecionada:", this._traCodigo);
    if (this._traCodigo > 0) {
      let loading = await this.utilProvider.mostrarCarregando("SELECIONANDO...");
      let transportadora = this._traPadrao;
      if (
        this._traPadrao == null ||
        (this._traPadrao != null && this._traCodigo != this._traPadrao.codigo)
      )
        transportadora = this._lstTransportadoras.find(
          (x) => x.codigo == this._traCodigo,
        ) || null;
      UtilProvider.objPedido.traCodigo = transportadora!.codigo;
      UtilProvider.objPedido.transportadora = transportadora;
      if (this._iniciarPedido) {
        this.utilProvider.esconderCarregando(loading);
        this.router.navigate(["/pedido/condicao-pagto"], { queryParams: { iniciarPedido: true } });
      } else {
        UtilProvider.recalcularValorItem(
          this.ivaProvider,
          this.pedidosItensProvider,
        ).then(() => {
          this.pedidosProvider.salvar(UtilProvider.objPedido).subscribe(() => {
            this.utilProvider.esconderCarregando(loading);
            this.modalCtrl.dismiss(transportadora);
          });
        });
      }
    } else {
      this.utilProvider.alertaBasico(
        "SELECIONE UMA TRANSPORTADORA",
        2000,
        "center",
      );
    }
  }

  keypress(event: { keyCode: number; }) {
    if (event.keyCode == 13) {
      this.pesquisar();
    }
  }

  doInfinite(infiniteScroll: InfiniteScrollCustomEvent) {
    console.log('infiniteScroll', infiniteScroll);
    this._carregando = true;
    this.proxima();
    infiniteScroll.target.complete();
  }

  compareWith(o1: number, o2: number): boolean {
    return o1 === o2;
  }

  voltar() {
    if (this._editarPedido) {
      this.router.navigate(["/master"]);
      return;
    }
    this.router.navigate(["/pedido/clientes"]);
  }
}
