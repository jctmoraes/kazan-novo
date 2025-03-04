import { ChangeDetectorRef, Component } from "@angular/core";
import { NavController } from "@ionic/angular";
import { Router } from '@angular/router';
import { ClienteCadastroProvider } from "@services/cliente-cadastro-provider";
import { ConfiguracaoProvider } from "@services/configuracao-provider";
import { FiliaisProvider } from "@services/filiais-provider";
import { FuncionariosProvider } from "@services/funcionarios-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { SincronizacaoProvider } from "@services/sincronizacao-provider";
import { UtilProvider } from "@services/util-provider";
import { AppComponent } from "app/app.component";
import { IClienteCadastro } from "app/interfaces/cliente-cadastro.interface";
import { IPedidosFiltro } from "app/interfaces/filtro/pedidos-filtro.interface";
import { IFuncionarios } from "app/interfaces/funcionarios.interface";
import { IPedidos } from "app/interfaces/pedidos.interface";

interface Filial {
  id: number;
  name: string;
}

@Component({
  selector: "page-master",
  templateUrl: "master.html",
  styleUrls: ["master.scss"],
  standalone: false,
})
export class MasterPage {
  public qtdCarrinho = 0;
  _lstPedidos: IPedidos[] = [];
  _cliCad: IClienteCadastro[] = [];
  private _funcionarioLogado: IFuncionarios = new IFuncionarios();

  _filial = "Filial";

  constructor(
    private funcionario: FuncionariosProvider,
    private sincronizacao: SincronizacaoProvider,
    public util: UtilProvider,
    private pedido: PedidosProvider,
    private pedidoItens: PedidosItensProvider,
    private cdr: ChangeDetectorRef,
    private configuracaoProvider: ConfiguracaoProvider,
    private cliCadProvider: ClienteCadastroProvider,
    private filialProv: FiliaisProvider,
    private router: Router,
    private myApp: AppComponent,
  ) {
    funcionario.buscarLogado().subscribe((retorno) => {
      configuracaoProvider.buscar().subscribe((configuracao) => {
        UtilProvider.configuracao = configuracao;
        //chamar css específico da empresa
        this._funcionarioLogado = retorno;
        UtilProvider.funCodigo = retorno.codigo;
        this.buscarPedido();
        this.sincronizar(false);
        this.cliCadProvider
          .buscarClientesCad(UtilProvider.funCodigo)
          .subscribe((x) => {
            this._cliCad = x;
            console.log("Busca de Clientes Cadastrados; ", this._cliCad);
          });
        if (funcionario.filialCod != null)
          this._funcionarioLogado.filial = funcionario.filialCod;
        this.filialProv
          .buscar(this._funcionarioLogado.filial.toString())
          .subscribe(
            (y) => {
              this._filial = y.nomeFantasia;
            },
            (err) => {
              this._filial = "Filial";
            },
          );
      });
    });
    /* this.cliCadProvider.buscarClientesCad(UtilProvider.funCodigo).subscribe(x => {
      this._cliCad = x;
      console.log('Busca de Clientes Cadastrados; ', this._cliCad);
    }); */
  }

  public async sincronizar(forcar: boolean) {
    const internetConectada = await this.util.internetConectada();
    if (internetConectada) {
      await this.sincronizacao
        .sincronizar(
          this._funcionarioLogado.codigo,
          this._funcionarioLogado.vendaProdImp,
          forcar,
          this.cdr,
        );
    }
  }

  sair() {
    this.myApp.sair();
  }

  editar(pedido: IPedidos) {
    UtilProvider.pedido = true;
    UtilProvider.objPedido = pedido;
    this.myApp.mudarPagina("TransportadoraPage", "NOVO PEDIDO");
  }

  iniciarPedido() {
    this.myApp.iniciarPedido();
  }

  buscarPedido() {
    this.pedido
      .buscar(
        UtilProvider.funCodigo,
        <IPedidosFiltro>{ status: 1 },
        0,
        5,
        false,
      )
      .subscribe((lstPedidos) => {
        if (lstPedidos != null && lstPedidos.length > 0) {
          lstPedidos.forEach((x) => {
            if (x.valor == 0) {
              this.pedido.excluir(x.codigo).subscribe(() => {
                lstPedidos.splice(
                  lstPedidos.findIndex((p) => p.codigo == x.codigo),
                  1,
                );
              });
            }
          });
          this._lstPedidos = lstPedidos;
        }
      });
  }

  retornarNomeCliente(cnpj: string) {
    /* this.cliCadProvider.buscarClientesCad(UtilProvider.funCodigo).subscribe(x => {
      this._cliCad = x;
      console.log('Busca de Clientes Cadastrados; ', this._cliCad);
      let aux = this._cliCad.find(y => y.cgcCpf == cnpj);
      return aux.razao;
    }); */

    //return 'a';

    let aux = this._cliCad.find((x) => x.cgcCpf == cnpj);
    console.log("+++++++  ", cnpj, " +++++++", aux);
    return aux?.razao;
  }

  openFilialSelection() {
    this.router.navigate(['seleciona-filial'], {
      state: {
        funcionario: this._funcionarioLogado.filial.toString(),
        callback: this.filialSelectedCallback.bind(this),
      },
    });
  }

  filialSelectedCallback(filial: string) {
    console.log(
      "esta aqui é a filial" +
        JSON.stringify(this.myApp.funcionarioLogado.filial),
    );
    this._filial = filial;
  }
}
