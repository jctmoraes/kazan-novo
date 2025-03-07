import { IClienteCadastro } from './../../interfaces/cliente-cadastro.interface';
import { ChangeDetectorRef, Component } from "@angular/core";
import { NavController, ModalController } from "@ionic/angular";
import { Router } from '@angular/router';
import { ClienteCadastroProvider } from "@services/cliente-cadastro-provider";
import { ConfiguracaoProvider } from "@services/configuracao-provider";
import { FiliaisProvider } from "@services/filiais-provider";
import { FuncionariosProvider } from "@services/funcionarios-provider";
import { PedidosItensProvider } from "@services/pedidos-itens-provider";
import { PedidosProvider } from "@services/pedidos-provider";
import { SincronizacaoProvider } from "@services/sincronizacao-provider";
import { UtilProvider } from "@services/util-provider";
import { AppComponent } from "src/app/app.component";
import { IPedidos } from "@interfaces/pedidos.interface";
import { IFuncionarios } from '@interfaces/funcionarios.interface';
import { IPedidosFiltro } from '@interfaces/filtro/pedidos-filtro.interface';
import { SelecionaFilialComponent } from '../seleciona-filial/seleciona-filial';

interface Filial {
  id: number;
  name: string;
}

@Component({
  selector: 'app-master',
  templateUrl: 'master.html',
  styleUrls: ['master.scss'],
  standalone: false,
})
export class MasterPage {
  public qtdCarrinho = 0;
  _lstPedidos: IPedidos[] = [];
  _cliCad: IClienteCadastro[] = [];
  private _funcionarioLogado: IFuncionarios = new IFuncionarios();

  _filial = 'SELECIONE';

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
    private modalController: ModalController,
    private myApp: AppComponent,
    private router: Router,
  ) {
    funcionario.buscarLogado().subscribe((retorno) => {
      // configuracaoProvider.buscar().subscribe((configuracao) => {
      //   UtilProvider.configuracao = configuracao;
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
              if (y?.nomeFantasia) {
                this._filial = y.nomeFantasia;
              }
            },
            (err) => {
              this._filial = "Filial";
            },
          );
      // });
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
    this.router.navigate(['/pedido/transportadoras'], { queryParams: { iniciarPedido: true, editarPedido: true } });
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

  async openFilialSelection() {
    const modal = await this.modalController.create({
      component: SelecionaFilialComponent, // Replace with your actual component
      componentProps: {
        funcionario: this._funcionarioLogado.filial.toString(),
      },
    });

    modal.onDidDismiss().then((detail) => {
      if (detail.data) {
        this.filialSelectedCallback(detail.data);
      }
    });

    return await modal.present();
  }

  filialSelectedCallback(filial: string) {
    console.log(
      "esta aqui é a filial" +
        JSON.stringify(this.myApp.funcionarioLogado.filial),
    );
    this._filial = filial;
  }
}
