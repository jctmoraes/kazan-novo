import { Component } from "@angular/core";
import { IClientes } from "@interfaces/clientes.interface";
import { IPedidosFiltro } from "@interfaces/filtro/pedidos-filtro.interface";
import { ITransportadoras } from "@interfaces/transportadoras.interface";
import { AlertController, InfiniteScrollCustomEvent, ModalController } from "@ionic/angular";
import { ClientesProvider } from "@services/clientes-provider";
import { FuncionariosProvider } from "@services/funcionarios-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { UtilProvider } from "@services/util-provider";
import { Router } from "@angular/router";
import { IPedidos } from "@interfaces/pedidos.interface";
import { TransportadoraPage } from "../transportadora/transportadora";

@Component({
  selector: "page-cliente",
  templateUrl: "cliente.html",
  styleUrls: ["cliente.scss"],
  standalone: false,
})
export class ClientePage {
  _lstClientes: IClientes[] = [];
  _funCodigo: number = 0;
  _pagina: number = -1; //início da páginação
  _qtdPorPagina: number = 30; //quantidade de registros a serem carregandos
  _carregando: boolean = false;
  _filtro: string = "";
  _qtdTotal: number = -1;
  _pedido: boolean = false;
  clientStatus: string = "active"; // initial value for no filter

  constructor(
    private router: Router,
    public modalCtrl: ModalController,
    private cliente: ClientesProvider,
    public util: UtilProvider,
    private funcionario: FuncionariosProvider,
    public alertController: AlertController,
    private pedido: PedidosProvider
  ) {
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
    this._pedido = UtilProvider.pedido;
    console.log('this._pedido', this._pedido);
    this._funCodigo = UtilProvider.funCodigo;
  }

  keypress(event: { keyCode: number; }) {
    if (event.keyCode == 13) {
      this.pesquisar();
    }
  }

  pesquisar() {
    if (this.clientStatus === "") {
      this._lstClientes = [];
      this._qtdTotal = -1;
      return;
    }

    this._pagina = -1;
    this._lstClientes = [];
    this.proxima();
  }

  proxima() {
    this._carregando = true;
    this._pagina++;
    const inicio = this._pagina * this._qtdPorPagina;

    console.log('this._pagina', this._pagina);

    if (this._pagina == 0) {
      console.log('this.clientStatus', this.clientStatus);
      if (this.clientStatus === "active") {
        this.cliente
          .buscarTotalAtivos(this._funCodigo, this._filtro)
          .subscribe((qtdTotal) => {
            this._qtdTotal = Number(qtdTotal);
          });
      } else if (this.clientStatus === "inactive") {
        this.cliente
          .buscarTotalInativos(this._funCodigo, this._filtro)
          .subscribe((qtdTotal) => {
            this._qtdTotal = Number(qtdTotal);
          });
      }
    }

    if (this.clientStatus === "active") {
      this.cliente
        .buscarAtivos(this._funCodigo, this._filtro, inicio, this._qtdPorPagina)
        .subscribe(
          (retorno: IClientes[]) => {
            if (retorno.length > 0) {
              this._lstClientes = this._lstClientes.concat(retorno);
            } else if (this._pagina == 0) {
              this.util.alertaBasico(
                "Nenhum cliente ativo encontrado",
                2500,
                "center"
              );
            }
            this._carregando = false;
          },
          (err) => {
            alert("Erro ao buscar os clientes ativos");
          }
        );
    } else if (this.clientStatus === "inactive") {
      this.cliente
        .buscarInativos(
          this._funCodigo,
          this._filtro,
          inicio,
          this._qtdPorPagina
        )
        .subscribe(
          (retorno: IClientes[]) => {
            if (retorno.length > 0) {
              this._lstClientes = this._lstClientes.concat(retorno);
            } else if (this._pagina == 0) {
              this.util.alertaBasico(
                "Nenhum cliente inativo encontrado",
                2500,
                "center"
              );
            }
            this._carregando = false;
          },
          (err) => {
            alert("Erro ao buscar os clientes inativos");
          }
        );
    }
  }

  async abrirDetalhe(cliente: IClientes) {
    let modal = await this.modalCtrl.create({
      component: "ClienteDetalhePage",
      componentProps: {
        cliente: cliente,
      },
    });
    modal.present();
  }

  async selecionar(cliente: IClientes) {
    this.pedido
      .buscarAberto(cliente.codigo, cliente.venCodigo)
      .subscribe(async (lstPedido) => {
        console.log("lstPedido", lstPedido);
        if (lstPedido.length > 0) {
          let msg = "HÁ UM PEDIDO EM ABERTO, DESEJA EDITÁ-LO?";
          let titulo = "PEDIDO ABERTO";
          if (lstPedido.length > 1) {
            msg =
              "ENCONTRAMOS PEDIDOS DESSE CLIENTE QUE NÃO FORAM FINALIZADOS, DESEJA VISUALIZÁ-LOS?";
            titulo = "PEDIDOS ABERTOS";
          }
          await this.util.confirmacao(
            msg,
            titulo,
            () => {
              if (lstPedido.length > 1) {
                let filtro = <IPedidosFiltro>{
                  cliCodigo: cliente.codigo,
                  cliNome: cliente.nome,
                  status: 1,
                };
                this.router.navigate(["/pedido"], { state: { filtro: filtro } });
              } else {
                lstPedido[0].cliente = cliente;
                lstPedido[0].transportadora = new ITransportadoras();
                UtilProvider.objPedido = lstPedido[0];
                this.router.navigate(["/transportadora"], {
                  state: { iniciarPedido: true, traCodigo: cliente.traCodigo },
                });
              }
            },
            () => {
              this.novoPedido(cliente);
            }
          );
        } else {
          this.novoPedido(cliente);
        }
      });
  }

  async novoPedido(cliente: IClientes) {
    console.log('novoPedido', cliente);
    const func = await this.funcionario.buscarLogado().toPromise();

    let pedido: IPedidos = <IPedidos>{
      codigo: 0,
      cliCodigo: cliente.codigo,
      valor: 0,
      status: 1,
      data: new Date(),
      desconto: 0,
      frete: "F",
      venCodigo: func.codigo,
      cpgCodigo: cliente.cpgCodigo,
      traCodigo: cliente.traCodigo,
      dtAlteracao: new Date(),
      cliente: cliente,
    };
    UtilProvider.objPedido = pedido;
    console.log('escolher transportadora');
    this.abrirTransportadora(cliente);
  }

  async abrirTransportadora(cliente: IClientes) {
    let modal = await this.modalCtrl.create({
      component: TransportadoraPage,
      componentProps: {
        cliente: cliente,
        iniciarPedido: true,
        traCodigo: cliente.traCodigo,
      },
    });
    // modal.onDidDismiss((transportadora) => {
    //   // Handle dismissal
    // });
    await modal.present();
  }

  obterClasse(cliente: IClientes) {
    if (cliente.bloqueado == 1) {
      return "status-vermelho";
    } else if (cliente.totalReceber + cliente.totalCheque > 0) {
      return "status-roxo";
    } else if (cliente.vencidoReceber + cliente.vencidoCheque > 0) {
      return "status-laranja";
    } else {
      return "status-verde";
    }
  }

  doInfinite(infiniteScroll: InfiniteScrollCustomEvent) {
    this._carregando = true;
    this.proxima();
    infiniteScroll.target.complete();
  }

  // doInfinite(event: IonInfiniteScrollCustomEvent<void>) {
  //   // Your existing code

  //   // Call the complete method on the event target
  //   (event.target as HTMLIonInfiniteScrollElement).complete();
  // }

  async msgDesc() {
    let confirm = await this.alertController.create({
      header: "Desconto",
      message: "Informe o % do desconto geral para o pedido",
      inputs: [
        {
          name: "descGeral",
          type: "number",
          id: "desc",
          value: "0",
          placeholder: "Informe o desconto geral",
        },
      ],
      buttons: [
        {
          text: "OK",
          handler: (alertData) => {
            console.log("****** desconto geral *******");
          },
        },
      ],
    });
    confirm.present();
  }

  fechar() {
    this.router.navigate(["/master"]);
  }
}
