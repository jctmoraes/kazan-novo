import { Injectable } from '@angular/core';
import { Observable, Subscriber } from "rxjs";
import { HttpClient } from '@angular/common/http';

import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { ICondicaoPagto } from '../interfaces/condicaoPagto.interface';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class CondicaoPagtoProvider extends ComandoProvider {
  private _arquivo: string = 'condicaoPagto.php';

  constructor(
    private http: HttpClient,
    private servidor: ServidorProvider,
    private util: UtilProvider,
    sqlite: SQLite) {
    super('condicaoPagto', new ICondicaoPagto(), sqlite);
  }

  porCodigo(codigo: string): Observable<ICondicaoPagto> {
    return new Observable(subs =>  {
      super.select({ codigo: codigo }).subscribe(
        (retorno) => {
          let condicao: ICondicaoPagto | null = null;
          if(retorno.rows.length > 0) {
            condicao = this.preencherObjeto(retorno.rows.item(0));
          }
          UtilProvider.completarObservable(subs, condicao);
        }
      );
    });
  }

  buscar(filtro: string, inicio: number, qtd: number, total: boolean): Observable<ICondicaoPagto[]> {
    return new Observable(subs =>  {
      let select = 'SELECT ';
      let from = ' FROM condicaoPagto';
      let where = '';

      if(total)
        select += ' COUNT(codigo) AS qtd';
      else
        select += ' codigo, descricao, desconto, acrescimo, valMinimo';

      if(filtro != '') {
        filtro = filtro.toLowerCase();
        where += ' WHERE LOWER(codigo) = \'' + filtro + '\' OR (LOWER(descricao) LIKE \'%' + filtro + '%\')';
      }

      if(!total) {
        where += ' ORDER BY descricao ASC';
        where += ' LIMIT ' + inicio + ', ' + qtd;
      }
      super.executeSql(select + from + where).subscribe(
        (retorno) => {
          if(total)
            UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
          else
            this.preencherObjetoList(retorno.rows, subs);
        }
      );
    });
  }

  excluir(): Observable<boolean> {
    return super.delete({ });
  }

  sincronizar(): Observable<ICondicaoPagto[]> {
    return new Observable<ICondicaoPagto[]>(
      subs => {
        this.servidor.get(this._arquivo).subscribe(
          (data) => {
            this.excluir().subscribe(() => {
              this.importJson(data).subscribe(
                () => {
                },
                err => {
                  alert('Erro na importação das condições de pagamento: ' + err)
                },
                () => {
                    UtilProvider.completarObservable(subs, true);
                }
              );
            });
          },
          err => {
            alert('Erro cond. pagto: ' + err);
            UtilProvider.completarObservable(subs, false);
          }
        );
      }
    );
  }

  private preencherObjetoList(linhas: any, subscriber: Subscriber<ICondicaoPagto[]>) {
    if(linhas.length > 0) {
      let lstRetorno = new Array<ICondicaoPagto>();
      for(let i = 0; i < linhas.length; i++) {
        let obj = this.preencherObjeto(linhas.item(i));
        lstRetorno.push(obj);
        if(lstRetorno.length == linhas.length) {
          UtilProvider.completarObservable(subscriber, lstRetorno);
        }
      }
    }
    else {
      UtilProvider.completarObservable(subscriber, new Array<ICondicaoPagto>());
    }
  }

  private preencherObjeto(linha: any): ICondicaoPagto {
    return <ICondicaoPagto>linha;
  }
}
