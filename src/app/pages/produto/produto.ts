import { Component, ViewChild, ChangeDetectorRef  } from "@angular/core";
import { IFaixaDescontos } from "@interfaces/faixaDescontos";
import { IFotos } from "@interfaces/fotos.interface";
import { IFuncionarios } from "@interfaces/funcionarios.interface";
import { IItens, IValor } from "@interfaces/itens.interface";
import { IPedidosItens } from "@interfaces/pedidosItens.interface";
import { InfiniteScrollCustomEvent, ModalController } from "@ionic/angular";
import { EstoqueProvider } from "@services/estoque-provider";
import { FaixaDescontosProvider } from "@services/faixaDescontos-provider";
import { FotosProvider } from "@services/fotos-provider";
import { FuncionariosProvider } from "@services/funcionarios-provider";
import { ItensProvider } from "@services/itens-provider";
import { IvaProvider } from "@services/iva-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { UtilProvider } from "@services/util-provider";
import { AppComponent } from "src/app/app.component";
// import { ImageViewerController } from "ionic-img-viewer";
import { Router } from "@angular/router";
import { ProdutoDetalhePage } from "../produto-detalhe/produto-detalhe";
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from "@capacitor/barcode-scanner";

@Component({
  selector: "app-produto",
  templateUrl: "produto.html",
  styleUrls: ["produto.scss"],
  standalone: false,
})
export class ProdutoPage {
  _titulo: string = "";
  _lstItens: IItens[] = [];
  _pagina: number = -1;
  _qtdPorPagina: number = 30;
  _carregando: boolean = false;
  _filtro: string = "";
  _qtdTotal: number = -1;
  _lstPedidosItens: IPedidosItens[] = [];
  _pedido: boolean = false;
  _total: number = 0;
  _valorProduto: number = 0;
  _valorDescProduto: number = 0;
  _cpgCodigo: string = "";
  _traCodigo: number = 0;
  private isFetching = false;  // Flag para evitar múltiplas buscas simultâneas
  _funcionario: IFuncionarios = null;
  _faixaDesconto: IFaixaDescontos = null;
  public _descGeral: any = 0;
  // _imageViewerCtrl: ImageViewerController;
  _fotos: IFotos = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    public modalCtrl: ModalController,
    public utilProvider: UtilProvider,
    private itemProvider: ItensProvider,
    private pedidoItensProvider: PedidosItensProvider,
    private pedidoProvider: PedidosProvider,
    private ivaProvider: IvaProvider,
    private fotosProvider: FotosProvider,
    // private imageViewerCtrl: ImageViewerController,
    private estoqueProvider: EstoqueProvider,
    private funcionarioProvider: FuncionariosProvider,
    private faixaDescontosProvider: FaixaDescontosProvider,
    private myApp: AppComponent,
  ) {
    funcionarioProvider.buscarLogado().subscribe((retorno) => {
      this._funcionario = retorno;
    });
  }

  ionViewWillEnter() {
    this._pedido = UtilProvider.pedido;
    if (UtilProvider.pedido) {
      this._titulo = UtilProvider.objPedido.cliente.nome;
      this._total = UtilProvider.objPedido.valor;
      if (UtilProvider.objPedido.pedidosItens != null)
        this._lstPedidosItens = UtilProvider.objPedido.pedidosItens;
      if (
        this._lstItens.length > 0 &&
        (this._cpgCodigo != UtilProvider.objPedido.cpgCodigo ||
          this._traCodigo != UtilProvider.objPedido.traCodigo)
      )
        this.pesquisar();
      this._cpgCodigo = UtilProvider.objPedido.cpgCodigo;
      this._traCodigo = UtilProvider.objPedido.traCodigo;
    } else {
      this._titulo = "PRODUTOS";
    }
  }

  keypress(event: { keyCode: number; }) {
    if (event.keyCode == 13) {
      this.pesquisar();
    }
  }

  lerCodigo() {
    let hint = {} as CapacitorBarcodeScannerTypeHint;
    CapacitorBarcodeScanner.scanBarcode({ hint: hint }).then((barcodeData) => {
      console.log("Barcode data", barcodeData);
      if (barcodeData.ScanResult !== '') {
        this._filtro = barcodeData.ScanResult;
        this.pesquisar();
      }
    });
  }

  pesquisar() {
    this._pagina = -1;
    this._lstItens = new Array<IItens>();
    this.proxima();
  }

  async proxima() {
    if (this.isFetching) return;  // Se já estiver buscando, ignorar novas chamadas

    this.isFetching = true;  // Inicia o bloqueio de novas buscas
    this._carregando = true;
    this._pagina++;

    const inicio = this._pagina * this._qtdPorPagina;
    const codFilialFuncLogado = this.myApp.funcionarioLogado.filial.toString();
    const codFilialStorage = localStorage.getItem("codFilialSet");
    const numFilial = parseInt(codFilialStorage || codFilialFuncLogado);

    if (this._pagina === 0) {
      try {
        const qtdTotal = await this.itemProvider.buscar(this._filtro, 0, 0, true).toPromise();
        this._qtdTotal = Number(qtdTotal);
        console.log('quantidade total:  ' + qtdTotal);
      } catch (err) {
        console.error("Erro ao buscar quantidade total", err);
      }
    }

    try {
      const retorno: IItens[] = await this.itemProvider.buscar(this._filtro, inicio, this._qtdPorPagina, false).toPromise();
      console.log(JSON.stringify(retorno.length));
      if (retorno.length > 0) {
        let requisicoesPendentes = retorno.length;
        const promises = retorno.map(async (item) => {
          await this.calcularValorItem(item);

          // Verifica se há requisições pendentes antes de continuar a buscar estoque
          if (requisicoesPendentes > 0) {
            try {
              const estoque: any = await this.estoqueProvider.porCodigo(item.codigo, numFilial).toPromise();
              item.estoque = estoque.quantidade;
              this._lstItens.push(item);
            } catch (error) {
              console.error("Erro ao buscar estoque", error);
            } finally {
              requisicoesPendentes--;
              console.log(requisicoesPendentes);
              if (requisicoesPendentes === 0) {
                this._carregando = false;
                this.cdr.detectChanges();  // Força a atualização da UI quando a busca termina
              }
            }
          }
        });

        await Promise.all(promises);

      } else if (this._pagina === 0) {
        this.utilProvider.alertaBasico("NENHUM PRODUTO ENCONTRADO", 2000, "center");
      }

    } catch (error) {
      console.error("Erro ao buscar os produtos", error);

    } finally {
      this.isFetching = false;  // Libera para a próxima busca
      this._carregando = false;  // Finaliza o estado de carregamento
      this.cdr.detectChanges();  // Força a detecção de mudanças após a finalização
    }
  }

  async abrirDetalhe(item: IItens) {
    let modal = await this.modalCtrl.create({
      component: ProdutoDetalhePage,
      componentProps: { item: item },
    });
    modal.present();
  }

  addProduto(item: IItens) {
    let valorP: number;
    if (item.qtd < 0) {
      this.utilProvider.alertaBasico(
        "QUANTIDADE DO ITEM NÃO PODE SER MENOR QUE 0",
        2500,
        "center",
      );
      return;
    }
    if (item.estoque < item.qtd) {
      this.utilProvider.alertaBasico(
        "ESTOQUE INSUFICIENTE. ESTOQUE ATUAL: " + item.estoque,
        2500,
        "center",
      );
      return;
    }

    if (UtilProvider.objPedido.valor === 0) {
      valorP = item.valorTotal;
    } else {
      valorP = UtilProvider.objPedido.valor;
    }

    this.faixaDescontosProvider
      .buscarFaixa(valorP, this._funcionario.filial)
      .subscribe((fx) => {
        this._faixaDesconto = fx;
        if (UtilProvider.objPedido.codigo == 0) {
          this.pedidoProvider
            .salvar(UtilProvider.objPedido)
            .subscribe((retorno) => {
              UtilProvider.objPedido.codigo = retorno;
              this.continuarAddProduto(item);
            });
        } else {
          if (
            this._lstPedidosItens.findIndex((x) => x.iteCodigo == item.codigo) >
            -1
          ) {
            this.utilProvider.alertaBasico(
              "PRODUTO JÁ ADICIONADO",
              2500,
              "center",
            );
          } else {
            this.continuarAddProduto(item);
          }
        }
      });
  }

  continuarAddProduto(item: IItens) {
    if (item.qtd == null) {
      item.qtd = 0;
    }
    let qtd = this.utilProvider.validarQuantidade(
      item.qtd.toString(),
      item.qtdMax,
      this._funcionario.estado,
    );
    if (qtd != item.qtd) {
      item.qtd = qtd;
    }
    this.calcularValorItem(item, item.qtd).then(() => {
      let pedidoItens = <IPedidosItens>{
        pedCodigo: UtilProvider.objPedido.codigo,
        sequencia: 0,
        iteCodigo: item.codigo,
      };
      pedidoItens.ipi = item.ipi;
      pedidoItens.valorIpi = item.iValor.valorIpi;
      pedidoItens.valor = item.valor;
      pedidoItens.valorUnitario = item.valorUnitario;
      pedidoItens.desconto = item.desconto;
      pedidoItens.valorSt = item.iValor.valorSt;
      pedidoItens.baseSt = item.iValor.baseSt;
      pedidoItens.quantidade = item.qtd;
      pedidoItens.total = item.valorTotal;
      pedidoItens.item = item;
      pedidoItens.pedCodigo = UtilProvider.objPedido.codigo;

      const desc = (item.valorTotal * pedidoItens.desconto) / 100;
      let valPed;

      if (UtilProvider.objPedido.valor > 0) {
        valPed = UtilProvider.objPedido.valor + item.valorTotal - desc;
      } else {
        valPed = item.valorTotal;
      }

      if (pedidoItens.item.descLimite == null) {
        pedidoItens.item.descLimite = 0;
      }

      if (pedidoItens.desconto > 0) {
        if (this._faixaDesconto === null) {
          if (
            parseFloat(pedidoItens.desconto.toString()) +
              parseFloat(this._descGeral) >
            pedidoItens.item.descLimite
          ) {
            pedidoItens.desconto = 0;
            this.utilProvider.alerta(
              "DESCONTO MAIOR QUE O LIMITE",
              "O LIMITE DE DESCONTO É " + pedidoItens.item.descLimite + "%",
              null,
            );
            return;
          }
          pedidoItens.desconto =
            parseFloat(pedidoItens.desconto.toString()) +
            parseFloat(this._descGeral);

          this.pedidoItensProvider
            .salvar(pedidoItens)
            .subscribe((sequencia) => {
              pedidoItens.sequencia = sequencia;
              this._lstPedidosItens.push(pedidoItens);
              UtilProvider.objPedido.valor += pedidoItens.total;
              this.pedidoProvider
                .salvar(UtilProvider.objPedido)
                .subscribe((retorno) => {
                  this._total = UtilProvider.objPedido.valor;
                  this.utilProvider.alertaBasico(
                    "PRODUTO ADICIONADO",
                    2000,
                    "center",
                  );
                });
            });
        } else {
          if (valPed < this._faixaDesconto.valde) {
            pedidoItens.desconto = 0;
            this.utilProvider.alerta(
              "DESCONTO MAIOR QUE A FAIXA",
              "O VALOR MINÍMO É R$ " + this._faixaDesconto.valde,
              null,
            );
            return;
          }

          if (pedidoItens.desconto > pedidoItens.item.descLimite) {
            pedidoItens.desconto = 0;
            this.utilProvider.alerta(
              "DESCONTO MAIOR QUE O LIMITE",
              "O LIMITE DE DESCONTO É " + pedidoItens.item.descLimite + "%",
              null,
            );
            return;
          }
          this.pedidoItensProvider
            .salvar(pedidoItens)
            .subscribe((sequencia) => {
              pedidoItens.sequencia = sequencia;
              this._lstPedidosItens.push(pedidoItens);
              UtilProvider.objPedido.valor += pedidoItens.total;
              this.pedidoProvider
                .salvar(UtilProvider.objPedido)
                .subscribe((retorno) => {
                  this._total = UtilProvider.objPedido.valor;
                  this.utilProvider.alertaBasico(
                    "PRODUTO ADICIONADO",
                    2000,
                    "center",
                  );
                });
            });
        }
      } else {
        this.pedidoItensProvider.salvar(pedidoItens).subscribe((sequencia) => {
          pedidoItens.sequencia = sequencia;
          this._lstPedidosItens.push(pedidoItens);
          UtilProvider.objPedido.valor += pedidoItens.total;
          this.pedidoProvider
            .salvar(UtilProvider.objPedido)
            .subscribe((retorno) => {
              this._total = UtilProvider.objPedido.valor;
              this.utilProvider.alertaBasico(
                "PRODUTO ADICIONADO",
                2000,
                "center",
              );
            });
        });
      }
    });
  }

  obterValor(item: IItens) {
    let valor = item.valor;
    return this.utilProvider.formatarMoeda(valor);
  }

  async calcularValorItem(item: IItens, qtd = 1): Promise<number> {
    return new Promise<number>((resolve) => {
      let valor: number = UtilProvider.calcularValorItem(
        item.valor - UtilProvider.round((item.valor * item.desconto) / 100),
        item.fabCodigo,
      );
      this.ivaProvider.buscar(item.claFiscal).subscribe((iva) => {
        let retorno: IValor = UtilProvider.calcularSt(
          valor * qtd,
          item.fabCodigo,
          item.codTributacao,
          item.ipi,
          iva,
          item.codCest,
        );
        item.iValor = retorno;
        item.valorUnitario = valor;
        item.valorTotal =
          UtilProvider.round(valor * qtd) +
          item.iValor.valorIpi +
          item.iValor.valorSt;
        resolve(0);
      });
    });
  }

  doInfinite(infiniteScroll: InfiniteScrollCustomEvent) {
    if (this._lstItens.length > 0) {
      this._carregando = true;
      this.proxima();
      infiniteScroll.target.complete();
    } else {
      this._carregando = false;
    }
  }

  async change(valorDigitado: any, cada: IItens) {
    console.log('valorDigitado', valorDigitado);
    const valor = valorDigitado as string;
    const qtd = this.utilProvider.validarQuantidade(
      valor,
      cada.qtdMax,
      this._funcionario.estado,
    );
    cada.qtd = qtd;
    await this.calcularValorItem(cada, qtd);
  }

  abrirCarrinho() {
    UtilProvider.objPedido.pedidosItens = this._lstPedidosItens;
    this.router.navigate(["/carrinho"]);
  }

  atualizarValorPedido(_lstPedidosItens: IPedidosItens[]) {
    this._lstPedidosItens = _lstPedidosItens;
    this._total = UtilProvider.objPedido.valor;
  }

  // @ViewChild(Navbar) navBar: Navbar;
  // ionViewDidLoad() {
  //   this.navBar.backButtonClick = (e: UIEvent) => {
  //     if (this._pedido) {
  //       if (this._lstItens.length > 0) {
  //         this._lstItens = [];
  //       } else {
  //         this.router.navigate([".."]);
  //       }
  //     } else {
  //       this.router.navigate([".."]);
  //     }
  //   };
  // }

  doViewImg(item: IItens) {
    // this._imageViewerCtrl = this.imageViewerCtrl;
    this.fotosProvider.buscar(item.codigo).subscribe((fotos) => {
      if (fotos == null && this.utilProvider.internetConectada()) {
        this.fotosProvider.sincronizar(item.codigo).subscribe((fotos) => {
          if (fotos != null) {
            this._fotos = fotos;
          }
        });
      } else {
        this._fotos = fotos;
      }
    });
  }

  abrirImagem(img: HTMLImageElement) {
    // const imageViewer = this._imageViewerCtrl.create(img);
    // imageViewer.present();
  }
}
