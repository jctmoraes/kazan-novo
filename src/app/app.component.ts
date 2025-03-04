import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IFuncionarios } from '@interfaces/funcionarios.interface';
import { MenuController, Platform } from '@ionic/angular';
import { BancoProvider } from '@services/banco/banco-provider';
import { FuncionariosProvider } from '@services/funcionarios-provider';
import { UtilProvider } from '@services/util-provider';
import { App } from '@capacitor/app';
import { IPedidos } from '@interfaces/pedidos.interface';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  _versao: string = '';
  funcionarioLogado: IFuncionarios = new IFuncionarios();

  constructor(
    private platform: Platform,
    private router: Router,
    private menuCtrl: MenuController,
    private bancoProvider: BancoProvider,
    private funcionarioProvider: FuncionariosProvider,
    private utilProvider: UtilProvider) {}

  ngOnInit() {
    this.platform.ready().then(() => {
      console.log('Plataforma pronta');
      this.bancoProvider.criarTabela().then(() => {
        this.funcionarioProvider.buscarLogado().subscribe((retorno) => {
          this.funcionarioLogado = retorno;
        });
        this.obterVersao().then((versao) => {
          this._versao = versao;
        });
      });
      SplashScreen.hide();
      StatusBar.setBackgroundColor({ color: '#044fa2' });
    });
  }

  async obterVersao() {
    const info = await App.getInfo();
    const versionNumber = info.version;
    UtilProvider.versao = versionNumber;
    return versionNumber;
  }

  sair() {
    this.menuCtrl.close();
    this.utilProvider.confirmacao('DESEJA SAIR DO APP?', 'CONFIRMAR SAÍDA',
      () => {
        this.utilProvider.mostrarCarregando('SAINDO...')
          .then((loading) => {
            this.funcionarioProvider.alterarLogado().subscribe(() => {
              //this.nav.setRoot('HomePage');
              this.router.navigateByUrl('/home');
              this.menuCtrl.enable(false);
              this.utilProvider.esconderCarregando(loading);
            });
          });
      });
  }

  mudarPagina(pagina: string, titulo: string = '') {
    this.menuCtrl.close();
    if (pagina != 'PrincipalPage') {
      if (titulo == 'NOVO PEDIDO')
        UtilProvider.pedido = true;
      else {
        UtilProvider.pedido = false;
        UtilProvider.objPedido = new IPedidos();
      }
      // this.nav.push(pagina, { iniciarPedido: true });
      this.router.navigateByUrl('/' + pagina);
    }
  }

  iniciarPedido() {
    UtilProvider.pedido = true;
    this.mudarPagina('cliente', 'NOVO PEDIDO');
  }
}
