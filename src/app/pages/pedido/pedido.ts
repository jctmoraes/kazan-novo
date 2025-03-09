import { Observable, forkJoin } from "rxjs";
import { Component, OnDestroy } from "@angular/core";
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent, ModalController } from "@ionic/angular";
import { PedidosProvider } from "@services/pedidos-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { IPedidos, IPedidosGeral } from "@interfaces/pedidos.interface";
import { IPedidosFiltro } from "@interfaces/filtro/pedidos-filtro.interface";
import { UtilProvider } from "@services/util-provider";
import { ServidorProvider } from "@services/servidor-provider";
import { HttpClient } from "@angular/common/http";
import { StatusPedidoProvider, IStatusPedido } from "@services/status-pedido";
import { FotosProvider } from "@services/fotos-provider";
import { IFotos } from "@interfaces/fotos.interface";
import { FiliaisProvider } from "@services/filiais-provider";
import { AppComponent } from "src/app/app.component";
import { PedidoFiltroPage } from "../filtro/pedido-filtro/pedido-filtro";
import { PedidoDetalhePage } from "../pedido-detalhe/pedido-detalhe";

@Component({
  selector: "page-pedido",
  templateUrl: "pedido.html",
  styleUrls: ["pedido.scss"],
  standalone: false,
})
export class PedidoPage implements OnDestroy {
  _banco: number = 0;
  _funCodigo: number = 0;
  _lstPedidos: IPedidosGeral[] = [];
  _filtro: IPedidosFiltro = new IPedidosFiltro();
  _pagina: number = -1; //início da páginação
  _qtdPorPagina: number = 30; //quantidade de registros a serem carregandos
  _carregando: boolean = false;
  _qtdTotal: number = -1;
  _atualizarMaster = false;
  _fimBusca: boolean = false;
  _fotos: IFotos | null = null;

  constructor(
    private router: Router,
    public modalCtrl: ModalController,
    // private printer: Printer,
    private pedidoProvider: PedidosProvider,
    private pedidoItensProvider: PedidosItensProvider,
    public utilProvider: UtilProvider,
    private statusPed: StatusPedidoProvider,
    public filialProv: FiliaisProvider,
    private myApp: AppComponent,
  ) {
    this._atualizarMaster = this.router.getCurrentNavigation()?.extras.state?.['atualizarMaster'] || false;
    let filtro = this.router.getCurrentNavigation()?.extras.state?.['filtro'];
    if (filtro != null) this._filtro = filtro;
    this._funCodigo = UtilProvider.funCodigo;
    this.proxima();
  }

  ngOnDestroy() {
    if (this._atualizarMaster) {
      // this.myApp.atualizarRoot();
      //ir para MasterPage
      this.router.navigate(['/master']);
    }
  }

  change() {
    this.pesquisar();
  }

  editar(pedido: IPedidos) {
    UtilProvider.pedido = true;
    UtilProvider.objPedido = pedido;
    this.router.navigate(["/transportadora"], { state: { iniciarPedido: "NOVO PEDIDO" } });
  }

  async copiar(pedido: IPedidos) {
    let loading = await this.utilProvider.mostrarCarregando("COPIANDO PEDIDO...");
    let codAnterior = pedido.codigo;
    pedido.codigo = 0;
    pedido.status = 1;
    pedido.data = new Date();
    pedido.dtAlteracao = new Date();
    this.pedidoProvider.salvar(pedido).subscribe((codigo) => {
      this.pedidoItensProvider
        .buscar(codAnterior, true)
        .subscribe((lstPedidosItens) => {
          let i = 0;
          lstPedidosItens.forEach((x) => {
            x.pedCodigo = codigo;
            x.sequencia = 0;
            this.pedidoItensProvider.salvar(x).subscribe(() => {
              i++;
              if (i == lstPedidosItens.length) {
                this.utilProvider.esconderCarregando(loading);
                this.utilProvider.alertaBasico("PEDIDO COPIADO COM SUCESSO!");
                this._filtro = new IPedidosFiltro();
                this.pesquisar();
              }
            });
          });
        });
    });
  }

  async excluir(pedido: IPedidos) {
    await this.utilProvider.confirmacao(
      "DESEJA REALMENTE EXCLUIR O PEDIDO N° " + pedido.codigo + "?",
      "CONFIMAR EXCLUSÃO",
      () => {
        this.pedidoItensProvider.excluir(pedido.codigo, 0).subscribe(() => {
          this.pedidoProvider.excluir(pedido.codigo).subscribe(() => {
            let index = this._lstPedidos.findIndex(
              (x) => x.codigo == pedido.codigo,
            );
            if (index > -1) {
              this._lstPedidos.splice(index, 1);
              this._qtdTotal--;
            }
            this._atualizarMaster = true;
            this.utilProvider.alertaBasico(
              "PEDIDO EXCLUÍDO COM SUCESSO",
              2000,
              "center",
            );
          });
        });
      },
    );
  }

  obterStatus(status: number) {
    return this.pedidoProvider.converterStatusNomes(status);
  }

  abrirDetalhe(pedido: IPedidos) {
    let profileModal = this.modalCtrl.create({
      component: PedidoDetalhePage,
      componentProps: { pedido: pedido },
    });
    profileModal.then(modal => modal.present());
  }

  abrirFiltro() {
    let profileModal = this.modalCtrl.create({
      component: PedidoFiltroPage,
      componentProps: { filtro: this._filtro },
    });
    profileModal.then(modal => {
      modal.onDidDismiss().then((parametro) => {
        if (parametro.data.buscar) {
          this._qtdTotal = 0;
          this._filtro = parametro.data.filtro;
          this._pagina = -1;
          this._lstPedidos = [];
          this.proxima();
        }
      });
      modal.present();
    });
  }

  async enviar(pedido: IPedidos, forcar: boolean = false) {
    if (pedido.status >= 2 && !forcar) {
    } else {
      if (this.utilProvider.internetConectada) {
        if (pedido.valor < pedido.condicaoPagto.valMinimo) {
          this.utilProvider.alerta(
            "VALOR ABAIXO DO MÍNIMO",
            "VLR. DO PEDIDO ABAIXO DO VLR. MÍNIMO DA CONDIÇÃO DE PAGTO. VLR. MIN: " +
              this.utilProvider.formatarMoeda(pedido.condicaoPagto.valMinimo),
            () => {},
          );
        } else {
          let loading = await this.utilProvider.mostrarCarregando("ENVIANDO...");
          this.pedidoItensProvider
            .buscar(pedido.codigo, false)
            .subscribe((lstPedidosItens) => {
              pedido.pedidosItens = lstPedidosItens;
              pedido.valorIpi = 0;
              pedido.valorSt = 0;
              pedido.baseSt = 0;
              pedido.valorDesconto = 0;

              lstPedidosItens.forEach((x) => {
                pedido.valorIpi += x.valorIpi;
                pedido.valorSt += x.valorSt;
                pedido.baseSt += x.baseSt;
                pedido.valorDesconto += x.desconto;
              });

              this.pedidoProvider.sincronizar(pedido).subscribe(
                (retorno) => {
                  pedido.status = 2;
                  pedido.dtEnvio = new Date();
                  pedido.numero = retorno;

                  this.pedidoProvider.salvar(pedido).subscribe(() => {
                    this.utilProvider.alerta(
                      "PEDIDO ENVIADO",
                      "PEDIDO ENVIADO COM SUCESSO!",
                      () => {
                        this.utilProvider.esconderCarregando(loading);
                      },
                    );
                    this._atualizarMaster = true;
                  });
                },
                (err) => {
                  this.utilProvider.alerta(
                    "OPS, OCORREU UM ERRO",
                    JSON.stringify(err),
                    null,
                  );
                  this.utilProvider.esconderCarregando(loading);
                },
              );
            });
        }
      } else {
        this.utilProvider.alerta("OPS", "SEM CONEXÃO COM A INTERNET", null);
      }
    }
  }

  enviarPdf(pedido: IPedidos) {
    this.utilProvider.confirmacao(
      "Deseja incluir imagens no PDF?",
      "Enviar PDF",
      () => this.navegarParaPedidoEmailPage(pedido, true),
      () => this.navegarParaPedidoEmailPage(pedido, false),
    );
  }

  async navegarParaPedidoEmailPage(pedido: IPedidos, incluirImagens: boolean) {
    try {
      const nomevendedor = this.myApp.funcionarioLogado.nome;
      const contatoVendedor = this.myApp.funcionarioLogado.telefone;
      const updatedPedido = {
        ...pedido,
        nomevendedor,
        incluirImagens,
        contatoVendedor,
      };
      this.router.navigate(["/pedido-email"], {
        state: { pedido: updatedPedido, pdf: true },
      });
      this._atualizarMaster = true;
    } catch (error) {
      this.utilProvider.alerta(
        "OPS, OCORREU UM ERRO",
        JSON.stringify(error),
        null,
      );
    }
  }

  enviarPlanilha(pedido: IPedidos) {
    this.router.navigate(["/pedido-planilha"], { state: { pedido: pedido, xlsx: true } });
    this._atualizarMaster = true;
  }

  pesquisar() {
    this._qtdTotal = 0;
    this._fimBusca = false;
    this._pagina = -1;
    this._lstPedidos = [];
    this.proxima();
  }

  proxima() {
    if (this._fimBusca) return;
    this._carregando = true;
    this._pagina++;
    let inicio = this._pagina * this._qtdPorPagina;
    if (this._pagina == 0) {
      this.pedidoProvider
        .buscar(this._funCodigo, this._filtro, 0, 0, true)
        .subscribe((qtdTotal) => {
          this._qtdTotal = Number(qtdTotal);
        });
    }
    console.log('inicio', inicio);
    console.log('this._qtdPorPagina', this._qtdPorPagina);
    console.log('this._filtro', this._filtro);
    console.log('this._funCodigo', this._funCodigo);
    this.pedidoProvider
      .buscar(this._funCodigo, this._filtro, inicio, this._qtdPorPagina, false)
      .subscribe(
        (retorno: IPedidosGeral[]) => {
          console.log("retorno", retorno);
          if (retorno.length > 0) {
            this._lstPedidos = this._lstPedidos.concat(retorno);
          } else {
            this._fimBusca = true;
          }
          this._carregando = false;

          this._lstPedidos.forEach((pedido) => {
            if (pedido.filial && pedido.filial != 0) {
              this.filialProv.buscar(pedido.filial.toString()).subscribe(
                (filialEncontrada) => {
                  pedido.nomeFilial = filialEncontrada.nomeFantasia;
                },
                (err) => {
                  pedido.nomeFilial = "Não definido";
                },
              );
            } else {
              pedido.nomeFilial = "Não definido";
            }
          });
        },
        (err) => {
          alert("Erro ao buscar os pedidos");
        },
      );
  }

  doInfinite(infiniteScroll: InfiniteScrollCustomEvent) {
    if (this._lstPedidos.length > 0) {
      this.proxima();
      infiniteScroll.target.complete();
    } else {
      this._carregando = false;
    }
  }

  doRefresh(event: any) {
    const observables$: Observable<IStatusPedido>[] = [];
    this._lstPedidos
      .filter((item) => item.numero > 0)
      .forEach((item) =>
        observables$.push(this.statusPed.getStatus(item.numero)),
      );

    forkJoin(observables$).subscribe(
      (results: IStatusPedido[]) => {
        results.forEach((retorno) => {
          try {
            const pedido = this._lstPedidos.filter(
              (pedido) => pedido.numero == retorno.Numero,
            )[0];
            const pedidoUpdate = {
              status: this.pedidoProvider.converterStatus(retorno.Status),
            } as IPedidos;
            pedido.status = pedidoUpdate.status;
            this.pedidoProvider.salvar(pedidoUpdate).subscribe(() => {});
            if (retorno.Item && retorno.Item.length > 0) {
              retorno.Item.forEach((item) =>
                this.pedidoProvider.atualizarItem(pedido, item),
              );
            }
          } catch {}
        });
        event.target.complete();
        this.proxima();
      },
      () => {
        event.target.complete();
      },
    );

    if (observables$.length == 0) {
      event.target.complete();
    }
  }

  imprimir(pedidosGeral: IPedidosGeral) {
  }

  voltar() {
    this.router.navigate(["/master"]);
  }
}
