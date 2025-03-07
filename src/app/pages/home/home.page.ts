import { Component } from '@angular/core';
import { IFuncionarios } from '../../interfaces/funcionarios.interface';
import { Config, MenuController, NavController } from '@ionic/angular';
import { FuncionariosProvider } from '@services/funcionarios-provider';
import { UtilProvider } from '@services/util-provider';
import { FiliaisProvider } from '@services/filiais-provider';
import { AppComponent } from 'src/app/app.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage {
  _login = { codigo: '', senha: '' };
  _versao: string = '';

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private funcionarioProvider: FuncionariosProvider,
    private utilProvider: UtilProvider,
    private filialProv: FiliaisProvider,
    private myApp: AppComponent,
    private config: Config,
    private navCtrl: NavController, // Add NavController here
  ) {
  }

  ngOnInit() {
    //console.log('ngOnInit');
    this.utilProvider.obterVersao().then((versao) => {
      this._versao = versao;
    });
    this.filialProv.sincronizar().subscribe(x => {
      console.log('Bucando filiais no Login ---> ', x);
    });
    const mode = this.config.get("mode");
    console.log('mode', mode);
  }

  async autenticar() {
    const loading = await this.utilProvider.mostrarCarregando('EFETUANDO LOGIN...');
    const internetConectada = await this.utilProvider.internetConectada();
    //verificar se internet está conectada
    if (internetConectada) {
      this.funcionarioProvider.autenticarApi(Number(this._login.codigo), this._login.senha).subscribe(
        (funcionario) => {
          this.autenticarFuncionario(funcionario, loading);
        },
        err => {
          //console.log('err', JSON.stringify(err));
          this.autenticarFuncionario(null, loading);
        }
      );
    }
    else {
      console.log('login', this._login);
      this.funcionarioProvider.autenticar(Number(this._login.codigo), this._login.senha).subscribe(
        (funcionario) => {
          this.autenticarFuncionario(funcionario, loading);
        }
      );
    }
  }

  async autenticarFuncionario(funcionario?: IFuncionarios, loading?: HTMLIonLoadingElement) {
    if (funcionario) {
      this.funcionarioProvider.alterarLogado().subscribe(
        () => {
          funcionario.logado = true;
          this.funcionarioProvider.salvar(funcionario).subscribe(
            () => {
              this.menuCtrl.enable(true);
              this.myApp.funcionarioLogado = funcionario;
              this.navCtrl.navigateRoot('master', { replaceUrl: true }); // Set masterPage as root and clear history
              this.utilProvider.esconderCarregando(loading);
            }
          );
        }
      );
    }
    else {
      this.utilProvider.esconderCarregando(loading);
      loading.onDidDismiss().then(async () => {
        await this.utilProvider.alerta('ACESSO NEGADO', 'CÓDIGO E/OU SENHA INVÁLIDOS', () => {});
      });
    }
  }

  mudarPagina() {
    this.router.navigate(['master']);
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad HomePage');
  }
}
