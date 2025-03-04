import { ICliCadastrado } from './../interfaces/cliCad.interface';
import { ServidorProvider } from './servidor-provider';
import { Injectable } from '@angular/core';
import { ComandoProvider } from "./banco/comando-provider";
import { UtilProvider } from "./util-provider";
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { map, mergeMap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClicadastradosProvider extends ComandoProvider {
  private _arquivo: string = 'clientes-cad.php?codigo=';

  constructor(private servidor: ServidorProvider, sqlite: SQLite) {

    super('cliCadastrados', new ICliCadastrado(), sqlite);
  }

  /* buscar(codigo: number): Observable<ICliCadastrado> {
    return new Observable(subs => {
      if (UtilProvider.objPedido != null && UtilProvider.objPedido.cliente != null) {
        super.select({ codigo: codigo, ufDest: UtilProvider.objPedido.cliente.estado }).subscribe(
          (retorno) => {
            UtilProvider.completarObservable(subs, retorno.rows.item(0));
          }
        );
      }
      else {
        UtilProvider.completarObservable(subs, null);
      }
    });
  } */

  excluir(): Observable<boolean> {
    return super.delete({});
  }

  sincronizar(venCodigo: number): Observable<any> {
    return this.servidor.get(this._arquivo + venCodigo)
      .pipe(
        mergeMap(data =>
          from(this.excluir()).pipe(
            mergeMap(() => from(this.importJson(data)).pipe(
              map(() => data)
            ))
          )
        )
      );
  }

  buscarCliente(cnpj: string): Observable<ICliCadastrado> {
    const auxCnpj = cnpj.trim();

    return new Observable(subs => {
      const sql = `SELECT cnpj FROM cliCadastrados WHERE cnpj='${auxCnpj}';`;

      try {
        super.executeSql(sql).subscribe(
          retorno => {
            let obj: ICliCadastrado | null = null;
            if (retorno.rows.length > 0) {
              obj = this.preencherObjeto(retorno.rows.item(0));
            }
            UtilProvider.completarObservable(subs, obj);
          },
          err => {
            console.error('Erro ao executar SQL:', err);
            UtilProvider.completarObservable(subs, null);
          }
        );
      } catch (err) {
        console.error('Erro:', err);
        UtilProvider.completarObservable(subs, null);
      }
    });
  }

  private preencherObjeto(linha: unknown): ICliCadastrado {
    return <ICliCadastrado>linha;
  }

}
