import { Injectable } from "@angular/core";
import { Observable, Subscriber } from "rxjs";
import { IFilial } from "../interfaces/filiais.interface";
import { ComandoProvider } from "./banco/comando-provider";
import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class FiliaisProvider extends ComandoProvider {
  private _arquivo: string = "filiais.php";

  constructor(
    private servidor: ServidorProvider,
    sqlite: SQLite
  ) {
    super("filiais", new IFilial(), sqlite);
  }

  excluir(): Observable<boolean> {
    return super.delete({});
  }

  sincronizar(): Observable<IFilial[]> {
    return new Observable<IFilial[]>((subs) => {
      this.servidor.get(this._arquivo).subscribe(
        (data) => {
          this.excluir().subscribe(() => {
            this.importJson(data).subscribe(
              () => {},
              (err) => {
                alert("*Erro na importação das filiais: " + err);
              },
              () => {
                UtilProvider.completarObservable(subs, true);
              }
            );
          });
        },
        (err) => {
          alert("Erro filiais: " + err);
          UtilProvider.completarObservable(subs, false);
        }
      );
    });
  }

  buscar(nFilial: number): Observable<IFilial> {
    return new Observable((subs) => {
      let select = "SELECT *";
      let from = " FROM filiais";
      let where = " WHERE codigo = " + nFilial;

      //console.log('Exibindo select filial: ', select + from + where);

      super.executeSql(select + from + where).subscribe((retorno) => {
        let filial: IFilial | null = null;
        // UtilProvider.completarObservable(subs, retorno)
        if (retorno.rows.length > 0) {
          filial = this.preencherObjeto(retorno.rows.item(0));
        }
        UtilProvider.completarObservable(subs, filial);
      });
    });
  }

  buscarFiliais(nFilial: string): Observable<IFilial[]> {
    return new Observable((subs) => {
      let select = "SELECT *";
      let from = " FROM filiais";
      let where = " WHERE codigo = " + nFilial;
      super.executeSql(select + from + where).subscribe((retorno) => {
        let filial: IFilial[] = [];
        // UtilProvider.completarObservable(subs, retorno)
        if (retorno.rows.length > 0) {
          retorno.rows.array.forEach((item: any) => {
            filial.push(this.preencherObjeto(item));
          });
        } else {
          filial.push(this.preencherObjeto(retorno.rows.item(0)));
        }

        UtilProvider.completarObservable(subs, filial);
      });
    });
  }

  buscarT(): Observable<IFilial[]> {
    return new Observable((subs) => {
      let select = "SELECT *";
      let from = " FROM filiais";
      let where = "";

      //console.log('Exibindo select filial: ', select + from + where);

      super.executeSql(select + from).subscribe((retorno) => {
        this.preencherObjetoList(retorno.rows, subs);
        /* let filial: IFilial = null;
          // UtilProvider.completarObservable(subs, retorno)
          if (retorno.rows.length > 0) {
            filial = this.preencherObjeto(retorno.rows.item(0));
          }
          UtilProvider.completarObservable(subs, filial); */
      });
    });
  }

  private preencherObjetoList(linhas: any, subscriber: Subscriber<any>) {
    if (linhas.length > 0) {
      let lstRetorno = new Array<IFilial>();
      for (let i = 0; i < linhas.length; i++) {
        let obj = this.preencherObjeto(linhas.item(i));
        lstRetorno.push(obj);
        if (lstRetorno.length == linhas.length) {
          UtilProvider.completarObservable(subscriber, lstRetorno);
        }
      }
    } else {
      UtilProvider.completarObservable(subscriber, new Array<IFilial>());
    }
  }

  private preencherObjeto(linha: any): IFilial {
    return <IFilial>linha;
  }
}
