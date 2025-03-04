import { Injectable } from "@angular/core";
import { Observable, Subscriber } from "rxjs";
import { IPedidosItens } from "../interfaces/pedidosItens.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { ItensProvider } from "./itens-provider";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class PedidosItensProvider extends ComandoProvider {
  constructor(
    private item: ItensProvider,
    sqlite: SQLite
  ) {
    super("pedidosItens", new IPedidosItens(), sqlite);
  }

  salvar(pedidoItens: IPedidosItens): Observable<number> {
    return new Observable((subs) => {
      // console.log('sequencia', pedidoItens.sequencia);
      if (pedidoItens.sequencia > 0) {
        this.update(pedidoItens, {
          pedCodigo: pedidoItens.pedCodigo,
          sequencia: pedidoItens.sequencia,
        }).subscribe((retorno) => {
          UtilProvider.completarObservable(subs, retorno);
        });
      } else {
        this.selectMax("sequencia", {
          pedCodigo: pedidoItens.pedCodigo,
        }).subscribe((max) => {
          max++;
          pedidoItens.sequencia = max;
          this.insert(pedidoItens).subscribe(
            (retorno: { insertId: number; success: boolean }) => {
              UtilProvider.completarObservable(subs, pedidoItens.sequencia);
            },
          );
        });
      }
    });
  }

  buscar(pedCodigo: number, ordemEmpresa: boolean): Observable<IPedidosItens[]> {
    return new Observable((subs) => {
      let ordem = null;
      if (ordemEmpresa) {
        ordem = { empresa: "ASC" };
      } else {
        ordem = { sequencia: "DESC" };
      }
      super.select({ pedCodigo: pedCodigo }, ordem).subscribe((retorno) => {
        if (retorno.rows.length > 0) {
          this.preencherObjetoList(subs, retorno.rows);
        } else {
          UtilProvider.completarObservable(subs, null);
        }
      });
    });
  }

  porCodigo(pedCodigo: number, iteCodigo: number): Observable<IPedidosItens> {
    return new Observable((subs) => {
      super
        .select({ pedCodigo: pedCodigo, iteCodigo: iteCodigo })
        .subscribe((retorno) => {
          UtilProvider.completarObservable(
            subs,
            this.preencherObjeto(retorno.rows.item(0)),
          );
        });
    });
  }

  excluir(pedCodigo: number, sequencia: number): Observable<boolean> {
    let parametro = { pedCodigo: pedCodigo, sequencia: 0 };
    if (sequencia > 0) {
      parametro.sequencia = sequencia;
    }
    // console.log('parametro', parametro);
    return super.delete(parametro);
  }

  private preencherObjetoList(subs: Subscriber<any>, linhas: any) {
    if (linhas.length > 0) {
      let lstRetorno = new Array<IPedidosItens>();
      for (let i = 0; i < linhas.length; i++) {
        let pedidosItens = this.preencherObjeto(linhas.item(i));
        this.item.porCodigo(pedidosItens.iteCodigo).subscribe((item) => {
          pedidosItens.item = item;
          // console.log('item', item);
          lstRetorno.push(pedidosItens);
          if (lstRetorno.length == linhas.length) {
            UtilProvider.completarObservable(subs, lstRetorno);
          }
        });
      }
      return lstRetorno;
    } else {
      return null;
    }
  }

  private preencherObjeto(linha: any): IPedidosItens {
    return <IPedidosItens>linha;
  }
}
