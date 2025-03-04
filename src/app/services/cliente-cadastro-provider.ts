import { IInfoSintegra } from "./../interfaces/sintegra.interface";
import { Injectable } from "@angular/core";
import { ComandoProvider } from "./banco/comando-provider";
import { ServidorProvider } from "./servidor-provider";
import { IClienteCadastro } from "../interfaces/cliente-cadastro.interface";
import { UtilProvider } from "./util-provider";
import { Observable, Subscriber } from "rxjs";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class ClienteCadastroProvider extends ComandoProvider {
  private _arquivo: string = "cliente-cadastro.php";
  //private _arquivo: string = 'cadastroCliente.php';
  constructor(
    private servidorProvider: ServidorProvider,
    sqlite: SQLite
  ) {
    super("clientecadastro", new IClienteCadastro(), sqlite);
  }

  salvar(clienteCadastro: IClienteCadastro): Observable<boolean> {
    console.log("***** salvar cliente");
    return new Observable((subs) => {
      this.insert(clienteCadastro).subscribe(
        (retorno: { insertId: number; success: boolean }) => {
          subs.next(retorno.success);
          subs.complete();
        },
      );
    });
  }

  enviar(clienteCadastro: IClienteCadastro): Observable<object> {
    console.log("Envio cliente ---->");
    console.log(clienteCadastro);
    return this.servidorProvider.post(this._arquivo, clienteCadastro);
  }

  getInfoSintegra(cnpj: string, token: string): Observable<IInfoSintegra> {
    let urlS = `https://www.sintegraws.com.br/api/v1/execute-api.php?token=${token}&cnpj=${cnpj}&plugin=ST`;

    return this.servidorProvider.getSint(urlS);

    /* this.servidorProvider.getToken().subscribe(x => {
      let url = `https://www.sintegraws.com.br/api/v1/execute-api.php?token=${x.value}&cnpj=${cnpj}&plugin=ST`;
      return this.servidorProvider.getSint(url);
    });

    return null; */
  }

  getTk() {
    let tk = this.servidorProvider.getToken();

    return tk;
  }

  buscar(venCodigo: number): Observable<IClienteCadastro[]> {
    return new Observable((subs) => {
      let select = "SELECT *";
      let from = " FROM clienteCadastro";
      let where = " WHERE codVen = " + venCodigo;

      super.executeSql(select + from + where).subscribe((retorno) => {
        this.preencherObjetoList(retorno.rows, subs);
      });
    });
  }

  buscarClientesCad(venCodigo: number): Observable<IClienteCadastro[]> {
    return new Observable((subs) => {
      let sql = "SELECT * FROM clienteCadastro WHERE codVen= " + venCodigo;

      super.executeSql(sql).subscribe((retorno) => {
        let obj: IClienteCadastro | null = null;
        if (retorno.rows.length > 0) {
          //obj = this.preencherObjeto(retorno.rows.item(0));
          this.preencherObjetoList(retorno.rows, subs);
        }
        //UtilProvider.completarObservable(subs, obj);
      });
    });
  }

  private preencherObjetoList(linhas: any, subscriber: Subscriber<IClienteCadastro[]>) {
    if (linhas.length > 0) {
      let lstRetorno = new Array<IClienteCadastro>();
      for (let i = 0; i < linhas.length; i++) {
        let obj = this.preencherObjeto(linhas.item(i));
        lstRetorno.push(obj);
        if (lstRetorno.length == linhas.length) {
          UtilProvider.completarObservable(subscriber, lstRetorno);
        }
      }
    } else {
      UtilProvider.completarObservable(
        subscriber,
        new Array<IClienteCadastro>(),
      );
    }
  }

  private preencherObjeto(linha: any): IClienteCadastro {
    return <IClienteCadastro>linha;
  }
}
