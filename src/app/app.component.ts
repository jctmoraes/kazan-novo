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
import { ConfiguracaoProvider } from '@services/configuracao-provider';
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen';

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
    private configuracaoProvider: ConfiguracaoProvider,
    private utilProvider: UtilProvider) {}

  ngOnInit() {
    this.platform.ready().then(() => {
      AndroidFullScreen.isImmersiveModeSupported()
        .then(() => AndroidFullScreen.immersiveMode())
        .catch(console.warn);
      this.menuCtrl.enable(false);
      this.bancoProvider.criarTabela().then(() => {
        this.funcionarioProvider.buscarLogado().subscribe((retorno) => {
          console.log('buscarLogado', retorno);
          if (retorno) {
            this.funcionarioLogado = retorno;
            UtilProvider.funCodigo = retorno.codigo;
            this.menuCtrl.enable(true);
            this.mudarPagina('/master');
          }
          this.configuracaoProvider.buscar().subscribe((configuracao) => {
            console.log('configuracao', configuracao);
            UtilProvider.configuracao = configuracao;
          });
        });
        this.utilProvider.obterVersao().then((versao) => {
          this._versao = versao;
        });
      });
      SplashScreen.hide();
      StatusBar.setBackgroundColor({ color: '#044fa2' });
      StatusBar.hide();
      // StatusBar.setOverlaysWebView({ overlay: true });
    });
  }

  async sair() {
    this.menuCtrl.close();
    await this.utilProvider.confirmacao('DESEJA SAIR DO APP?', 'CONFIRMAR SAÍDA',
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
    this.mudarPagina('pedido/clientes', 'NOVO PEDIDO');
  }

  fecharMenu() {
    this.menuCtrl.close();
  }
}
