import { Component } from '@angular/core';
import { IFuncionarios } from '../../interfaces/funcionarios.interface';
import { MenuController } from '@ionic/angular';
import { FuncionariosProvider } from '@services/funcionarios-provider';
import { UtilProvider } from '@services/util-provider';
import { FiliaisProvider } from '@services/filiais-provider';
import { AppComponent } from 'app/app.component';
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
    private myApp: AppComponent) {
    this._versao = UtilProvider.versao;

    filialProv.sincronizar().subscribe(x => {
      console.log('Bucando filiais no Login ---> ', x);
    });
  }

  async autenticar() {
    console.log('autenticar');
    const internetConectada = await this.utilProvider.internetConectada();
    // this._loading = this.utilProvider.mostrarCarregando('EFETUANDO LOGIN...');
    //verificar se internet está conectada
    if (internetConectada) {
      this.funcionarioProvider.autenticarApi(Number(this._login.codigo), this._login.senha).subscribe(
        (funcionario) => {
          this.autenticarFuncionario(funcionario);
        },
        err => {
          //console.log('err', JSON.stringify(err));
          this.autenticarFuncionario(null);
        }
      );
    }
    else {
      this.funcionarioProvider.autenticar(Number(this._login.codigo), this._login.senha).subscribe(
        (funcionario) => {
          this.autenticarFuncionario(funcionario);
        }
      );
    }
  }

  autenticarFuncionario(funcionario: IFuncionarios | null) {
    if (funcionario != null) {
      this.funcionarioProvider.alterarLogado().subscribe(
        () => {
          funcionario.logado = true;
          this.funcionarioProvider.salvar(funcionario).subscribe(
            () => {
              this.menuCtrl.enable(true);
              this.myApp.funcionarioLogado = funcionario;
              this.mudarPagina();
            }
          );
        }
      );
    }
    else {
      this.utilProvider.alerta('ACESSO NEGADO', 'CÓDIGO E/OU SENHA INVÁLIDOS', () => {
        // this.utilProvider.esconderCarregando(this._loading);
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
