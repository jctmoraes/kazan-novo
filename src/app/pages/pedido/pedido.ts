import { Observable, forkJoin } from "rxjs";
import { Component, OnDestroy } from "@angular/core";
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent, ModalController } from "@ionic/angular";
import { PedidosProvider } from "@services/pedidos-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { IPedidos, IPedidosGeral } from "@interfaces/pedidos.interface";
import { IPedidosFiltro } from "@interfaces/filtro/pedidos-filtro.interface";
import { UtilProvider } from "@services/util-provider";
import { HttpClient } from "@angular/common/http";
import { StatusPedidoProvider, IStatusPedido } from "@services/status-pedido";
import { FotosProvider } from "@services/fotos-provider";
import { IFotos } from "@interfaces/fotos.interface";
import { FiliaisProvider } from "@services/filiais-provider";
import { AppComponent } from "src/app/app.component";
import { PedidoFiltroPage } from "../filtro/pedido-filtro/pedido-filtro";
import { PedidoDetalhePage } from "../pedido-detalhe/pedido-detalhe";
import { PedidoEmailPage } from "../pedido-email/pedido-email";
import { PedidoPlanilhaPage } from "../pedido-planilha/pedido-planilha";
import { FilialSelecionadaService } from "@services/filial-selecionada.service";

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
  _fimBusca: boolean = true;
  _fotos: IFotos | null = null;

  constructor(
    private router: Router,
    public modalCtrl: ModalController,
    private pedidoProvider: PedidosProvider,
    private pedidoItensProvider: PedidosItensProvider,
    public utilProvider: UtilProvider,
    private statusPed: StatusPedidoProvider,
    public filialProv: FiliaisProvider,
    private myApp: AppComponent,
    private http: HttpClient,
    private fotosProvider: FotosProvider,
    private filialSelecionadaService: FilialSelecionadaService,
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
    console.log("change");
    this.pesquisar();
  }

  editar(pedido: IPedidos) {
    UtilProvider.pedido = true;
    UtilProvider.objPedido = pedido;
    this.router.navigate(['/pedido/transportadoras'], { queryParams: { iniciarPedido: true, editarPedido: true } });
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
                    this.utilProvider.esconderCarregando(loading);
                    this.utilProvider.alerta(
                      "PEDIDO ENVIADO",
                      "PEDIDO ENVIADO COM SUCESSO!",
                      () => {
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
    const nomevendedor = this.myApp.funcionarioLogado.nome;
    const contatoVendedor = this.myApp.funcionarioLogado.telefone;
    const updatedPedido = {
      ...pedido,
      nomevendedor,
      incluirImagens,
      contatoVendedor,
    };
    // this.router.navigate(["/pedido-email"], {
    //   state: { pedido: updatedPedido, pdf: true },
    // });
    //abrir modal PedidoEmailPage
    const modal = await this.modalCtrl.create({
      component: PedidoEmailPage,
      componentProps: { pedido: updatedPedido, pdf: true },
    });
    modal.present();
  }

  async enviarPlanilha(pedido: IPedidos) {
    const modal = await this.modalCtrl.create({
      component: PedidoPlanilhaPage,
      componentProps: { pedido: pedido, xlsx: true },
    });
    modal.present();
  }

  pesquisar() {
    this._qtdTotal = 0;
    this._fimBusca = true;
    this._pagina = -1;
    this._lstPedidos = [];
    this.proxima();
  }

  proxima() {
    console.log('this._fimBusca', this._fimBusca);
    if (!this._fimBusca) return;
    this._carregando = true;
    this._pagina++;
    let inicio = this._pagina * this._qtdPorPagina;
    if (this._pagina == 0) {
      this.pedidoProvider
        .buscar(this._funCodigo, this._filtro, 0, 0, true)
        .subscribe((qtdTotal) => {
          console.log("qtdTotal", qtdTotal);
          this._qtdTotal = Number(qtdTotal);
        });
    }
    this.pedidoProvider
      .buscar(this._funCodigo, this._filtro, inicio, this._qtdPorPagina, false)
      .subscribe(
        (retorno: IPedidosGeral[]) => {
          console.log('retorno', retorno);
          if (retorno.length > 0) {
            this._lstPedidos = this._lstPedidos.concat(retorno);
          } else {
            this._fimBusca = true;
          }
          this._carregando = false;

          this._lstPedidos.forEach((pedido) => {
            if (pedido.filial && pedido.filial != 0) {
              this.filialProv.buscar(pedido.filial).subscribe(
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

  imprimir(pedido: IPedidos) {
    this.utilProvider.confirmacao(
      "Deseja incluir imagens no PDF?",
      "Imprimir",
      () => this.processarImpressao(pedido, true),
      () => this.processarImpressao(pedido, false),
    );
  }

  async processarImpressao(pedido: IPedidos, incluirImagens: boolean) {
    const numFilial = this.filialSelecionadaService.getFilialSelecionada();
    let loading = await this.utilProvider.mostrarCarregando("IMPRIMINDO...");
    let text = "";
    try {
      let html = await this.http
        .get("assets/impressao/pedido.html", { responseType: 'text' })
        .toPromise();

      const lstPedidosItens = await this.pedidoItensProvider
        .buscar(pedido.codigo, false)
        .toPromise();
      let itens = "";
      let thIncluso =
        "<th>Qtd</th><th>Emb</th><th>Cod</th><th>GTIN</th><th>Marca</th><th>Descrição</th><th>Vr IPI (+)</th><th>Vr ST</th><th>Vr Un</th><th>Vr Total</th>";

      let valorIpiTotal = 0;
      let valorStTotal = 0;
      let fotoCount = 0; // Contador para fotos

      for (const x of lstPedidosItens) {
        valorIpiTotal += x.valorIpi;
        valorStTotal += x.valorSt;

        let fotos = await this.fotosProvider.buscar(x.iteCodigo).toPromise();
        if (fotos == null && this.utilProvider.internetConectada()) {
          fotos = await this.fotosProvider.sincronizar(x.iteCodigo).toPromise();
        }
        this._fotos = fotos || this._fotos;
        let imagemHtml = "";

        if (incluirImagens && fotoCount < 60) {
          imagemHtml = `<td><img src="data:image/jpeg;base64,${this._fotos.imagem1 || ""}" alt="Imagem do Item" width="100"></td>`;
          thIncluso =
            "<th></th> <th>Qtd</th> <th>Emb</th> <th>Cod</th><th>Marca</th> <th>Descrição</th> <th>Vr IPI (+)</th> <th>Vr ST</th> <th>Vr Un</th> <th>Vr Total</th>";
          fotoCount++; // Incrementa o contador de fotos
        }

        itens += `<tr>
                  ${imagemHtml}
                  <td>${x.quantidade}</td>
                  <td>${x.item.embalagem}</td>
                  <td>${x.iteCodigo}</td>
                  <td>${x.item.fabricante.nome}</td>
                  <td>${x.item.nome}</td>
                  <td>${this.utilProvider.formatarMoeda(x.valorIpi)}</td>
                  <td>${this.utilProvider.formatarMoeda(x.valorSt)}</td>
                  <td>${this.utilProvider.formatarMoeda(
                    x.valorUnitario +
                      x.valorIpi / x.quantidade +
                      x.valorSt / x.quantidade,
                  )}</td>
                  <td>${this.utilProvider.formatarMoeda(
                    x.valorUnitario * x.quantidade + x.valorIpi + x.valorSt,
                  )}</td>
              </tr>`;
      }

      const valorIpiFormatado = this.utilProvider.formatarMoeda(valorIpiTotal);
      const valorStFormatado = this.utilProvider.formatarMoeda(valorStTotal);
      const valorMercadoria = pedido.valor - valorIpiTotal - valorStTotal;
      const valorMercadoriaFormatado =
        this.utilProvider.formatarMoeda(valorMercadoria);

      // Calcular a data de validade
      const dataValidade = new Date(pedido.data);
      dataValidade.setDate(dataValidade.getDate() + 3);
      const validadeFormatada = this.utilProvider.formatarData(dataValidade); // Método hipotético de formatação

      // Verificar numFilial e definir CNPJ
      let cnpjEmpresa = "";
      if (numFilial === 4) {
        cnpjEmpresa = "15.631.531/0001-50";
      } else if (numFilial === 20) {
        cnpjEmpresa = "15.631.531/0007-45";
      }

      html = html.replace("{TH-INCLUSA}", thIncluso);
      html = html.replace(
        "{NUMERO}",
        (pedido.numero == null ? pedido.codigo : pedido.numero).toString(),
      );
      html = html.replace("{CONDICAO}", text);
      html = html.replace(
        "{DATA}",
        this.utilProvider.formatarDataHora(pedido.data),
      );
      html = html.replace("{VALIDADE}", validadeFormatada); // Inserindo a data de validade no HTML
      html = html.replace("{CNPJ_EMPRESA}", cnpjEmpresa); // Inserindo o CNPJ no HTML
      html = html.replace("{VENDEDOR}", this.myApp.funcionarioLogado.nome);
      html = html.replace(
        "{VENDEDOR-CONTATO}",
        this.myApp.funcionarioLogado.telefone,
      );
      html = html.replace("{NOME}", pedido.cliente.nome);
      html = html.replace("{CNPJ}", pedido.cliente.cnpj);
      html = html.replace("{ENDERECO}", pedido.cliente.endereco);
      html = html.replace("{NUMERO_END}", pedido.cliente.numero);
      html = html.replace("{BAIRRO}", pedido.cliente.bairro);
      html = html.replace("{CIDADE}", pedido.cliente.cidade);
      html = html.replace("{ESTADO}", pedido.cliente.estado);
      html = html.replace("{TELEFONE}", pedido.cliente.telefone);
      html = html.replace("{CEP}", pedido.cliente.cep);
      html = html.replace("{CONTATO}", pedido.cliente.contato);
      html = html.replace("{INSCRICAO_ESTADUAL}", pedido.cliente.ie);
      html = html.replace("{COD_CLI}", pedido.cliente.codigo.toString());
      html = html.replace("{ITENS}", itens);
      html = html.replace("{TRANSPORTADORA}", pedido.transportadora.nome);
      html = html.replace("{FRETE}", pedido.frete);
      html = html.replace(
        "{DESCONTO}",
        this.utilProvider.formatarMoeda(pedido.desconto),
      );
      html = html.replace(
        "{TOTAL}",
        this.utilProvider.formatarMoeda(pedido.valor),
      );
      html = html.replace("{OBSERVACAO}", pedido.observacao);

      // Adicionando as novas variáveis no HTML
      html = html.replace("{VALOR_IPI}", valorIpiFormatado);
      html = html.replace("{VALOR_ST}", valorStFormatado);
      html = html.replace("{VALOR_MERCADORIA}", valorMercadoriaFormatado);

      // let options: PrintOptions = {
      //   duplex: true,
      //   // landscape: false,
      //   // grayscale: true,
      // };

      // await this.printer.print(html, options);
      this.utilProvider.esconderCarregando(loading);
    } catch (error) {
      this.utilProvider.esconderCarregando(loading);
      console.error("Erro ao imprimir o pedido:", error);
    }
  }

  async imprimirHtml(html: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      console.error('Failed to open print window');
    }
  }

  voltar() {
    this.router.navigate(["/master"]);
  }
}
