import { Injectable } from "@angular/core";
import { ServidorProvider } from "./servidor-provider";
import { ITransportadoras } from "../interfaces/transportadoras.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class TransportadorasProvider extends ComandoProvider {
  private _arquivo: string = "transportadoras.php";

  constructor(
    public http: HttpClient,
    private servidor: ServidorProvider,
    banco: SQLite
  ) {
    super("transportadoras", new ITransportadoras(), banco);
  }

  salvar(transportadora: ITransportadoras): Observable<{ insertId: number; success: boolean }> {
    return this.insert(transportadora);
  }

  porCodigo(codigo: number): Observable<ITransportadoras> {
    return new Observable((subs) => {
      super.select({ codigo: codigo }).subscribe((retorno) => {
        let transportadora: ITransportadoras | null = null;
        if (retorno.rows.length > 0) {
          transportadora = this.preencherObjeto(retorno.rows.item(0));
        }
        UtilProvider.completarObservable(subs, transportadora);
      });
    });
  }

  buscar(
    filtro: string,
    inicio: number,
    qtd: number,
    total: boolean,
  ): Observable<ITransportadoras[]> {
    return new Observable((subs) => {
      let select = "SELECT ";
      let from = " FROM transportadoras";
      let where = "";

      if (total) select += " COUNT(codigo) AS qtd";
      else select += " codigo, nome, perDesc, perAcres";

      if (filtro != "") {
        if (UtilProvider.validarNumero(filtro))
          where += " WHERE codigo = " + filtro;
        else where += " WHERE (nome LIKE '%" + filtro + "%')";
      }

      if (!total) {
        where += " ORDER BY nome ASC";
        where += " LIMIT " + inicio + ", " + qtd;
      }
      // alert(select + from + where)
      super.executeSql(select + from + where).subscribe((retorno) => {
        if (total)
          UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
        else this.preencherObjetoList(retorno.rows, subs);
      });
    });
  }

  excluir(): Observable<boolean> {
    return super.delete({});
  }

  sincronizar(): Observable<ITransportadoras[]> {
    return new Observable<ITransportadoras[]>((subs) => {
      this.servidor.get(this._arquivo).subscribe(
        (data) => {
          this.excluir().subscribe(() => {
            this.importJson(data).subscribe(
              () => {
                //alert('Transportadoras importadas')
              },
              (err) => {
                alert("Erro na importação das transportadoras: " + err);
              },
              () => {
                UtilProvider.completarObservable(subs, true);
              },
            );
          });
        },
        (err) => {
          alert("Erro transportadora: " + err);
          UtilProvider.completarObservable(subs, false);
        },
      );
    });
  }

  private preencherObjetoList(linhas: any, subscriber: any) {
    if (linhas.length > 0) {
      let lstRetorno = new Array<ITransportadoras>();
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
        new Array<ITransportadoras>(),
      );
    }
  }

  private preencherObjeto(linha: any): ITransportadoras {
    return <ITransportadoras>linha;
  }
}
