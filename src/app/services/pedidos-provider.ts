import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  IPedidos,
  IPedidosGeral,
  mapPedidosGeral,
} from "../interfaces/pedidos.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IPedidosFiltro } from "../interfaces/filtro/pedidos-filtro.interface";
import { ClientesProvider } from "./clientes-provider";
import { TransportadorasProvider } from "./transportadoras-provider";
import { CondicaoPagtoProvider } from "./condicaoPagto-provider";
import { ServidorProvider } from "./servidor-provider";
import { FuncionariosProvider } from "./funcionarios-provider";
import { SQLite, SQLiteObject } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class PedidosProvider extends ComandoProvider {
  private _arquivo: string = "pedidos.php";

  constructor(
    private clienteProvider: ClientesProvider,
    private transportadoraProvider: TransportadorasProvider,
    private condicaoPagtoProvider: CondicaoPagtoProvider,
    private servidorProvider: ServidorProvider,
    private funcionarioProvider: FuncionariosProvider,
    banco: SQLite
  ) {
    super("pedidos", new IPedidosGeral(), banco);
  }

  salvar(pedido: IPedidos): Observable<number> {
    return new Observable((subs) => {
      if (pedido.codigo > 0) {
        this.update(pedido, { codigo: pedido.codigo }).subscribe(
          (retorno: boolean) => {
            UtilProvider.completarObservable(subs, retorno);
          },
        );
      } else {
        //1 + max + codigo + data.getHours() + data.getMinutes() + data.getSeconds()
        this.selectMax("codigo", {}).subscribe((max) => {
          max++;
          pedido.codigo = max;
          this.insert(pedido).subscribe(
            (retorno: { insertId: number; success: boolean }) => {
              UtilProvider.completarObservable(subs, pedido.codigo);
            },
          );
        });
      }
    });
  }

  salvarPedidoGeral(pedido: IPedidosGeral): Observable<number> {
    return new Observable((subs) => {
      if (pedido.codigo > 0) {
        this.update(pedido, { codigo: pedido.codigo }).subscribe(
          (retorno: boolean) => {
            UtilProvider.completarObservable(subs, retorno);
          },
        );
      } else {
        //1 + max + codigo + data.getHours() + data.getMinutes() + data.getSeconds()
        this.selectMax("codigo", {}).subscribe((max) => {
          max++;
          pedido.codigo = max;
          this.insert(pedido).subscribe(
            (retorno: { insertId: number; success: boolean }) => {
              UtilProvider.completarObservable(subs, pedido.codigo);
            },
          );
        });
      }
    });
  }

  atualizarItem(pedido: IPedidos, item: { id: number; qtdFat: number }) {
    this.conectar().then((db: SQLiteObject) => {
      const sql = `UPDATE pedidosItens SET qtdFat = ${item.qtdFat} WHERE pedCodigo = ${pedido.codigo} AND iteCodigo = ${item.id}`;
      db.executeSql(sql, []).then(
        () => console.log(sql),
        (err: any) => console.error(err),
      );
    });
  }

  porCodigo(
    codigo: number,
    empresa: number,
    banco: string,
  ): Observable<IPedidos> {
    return new Observable((subs) => {
      super
        .select({ codigo: codigo, empresa: empresa, banco: banco })
        .subscribe((retorno) => {
          let pedido: IPedidos | null = null;
          if (retorno.rows.length > 0) {
            pedido = this.preencherObjeto(retorno.rows.item(0));
          }
          UtilProvider.completarObservable(subs, pedido);
        });
    });
  }

  buscarAberto(cliCodigo: number, venCodigo: number): Observable<IPedidos[]> {
    return new Observable((subs) => {
      super
        .select({ venCodigo: venCodigo, status: 1, cliCodigo: cliCodigo })
        .subscribe((retorno) => {
          this.preencherObjetoList(retorno.rows, subs);
        });
    });
  }

  buscar(
    venCodigo: number,
    filtro: IPedidosFiltro,
    inicio: number,
    qtd: number,
    total: boolean,
  ): Observable<IPedidosGeral[]> {
    return new Observable((subs) => {
      let select = "SELECT ";
      let from = " FROM pedidos p";
      let where = " WHERE p.venCodigo = " + venCodigo;
      if (total) select += " COUNT(p.codigo) AS qtd";
      else select += " *";
      //, (SELECT SUM(total) FROM pedidosItens pi WHERE p.codigo = pi.pedCodigo AND pi.banco = p.banco) AS valor

      if (filtro != null) {
        if (filtro.cliCodigo > 0) {
          if (where == "") where = " WHERE";
          else where += " AND";
          where += " p.cliCodigo = " + filtro.cliCodigo;
        }
        if (filtro.status > 0) {
          if (where == "") where = " WHERE";
          else where += " AND";
          where += " p.status = " + filtro.status;
        }
        if (filtro.dtInicio != null) {
          if (where == "") where = " WHERE";
          else where += " AND";
          where += ' p.data >= "' + filtro.dtInicio + '"';
        }
        if (filtro.dtFim != null) {
          if (where == "") where = " WHERE";
          else where += " AND";
          where += ' p.data < "' + filtro.dtFim + '"';
        }
      }
      if (!total) {
        where += " ORDER BY p.data DESC";
        where += " LIMIT " + inicio + ", " + qtd;
      }
      super.executeSql(select + from + where).subscribe((retorno) => {
        if (total)
          UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
        else this.preencherObjetoList(retorno.rows, subs);
      });
    });
  }

  excluir(codigo: number): Observable<boolean> {
    return super.delete({ codigo: codigo });
  }
  excluirTodos(): Observable<boolean> {
    return new Observable((observer) => {
      this.conectar().then((db) => {
        const sql = "DELETE FROM pedidos";
        console.log(
          "Executando comando SQL para excluir todos os pedidos:",
          sql,
        );
        db.executeSql(sql, []).then(
          () => {
            console.log("Todos os pedidos foram excluídos com sucesso.");
            observer.next(true);
            observer.complete();
          },
          (err) => {
            console.error("Erro ao excluir todos os pedidos:", err);
            observer.error(err);
          },
        );
      });
    });
  }

  sincronizar(
    pedido: IPedidos,
    pdf: boolean = false,
    xlsx: boolean = false,
  ): Observable<number> {
    let arquivo = this._arquivo;
    let filial = this.funcionarioProvider.filialCod;
    let pedidoGeral: IPedidosGeral = mapPedidosGeral(pedido, filial);

    if (pedido.pedidoEmail) {
      pedidoGeral.pedidoEmail = pedido.pedidoEmail;
    }
    if (pedido.emailInformado) {
      pedidoGeral.emailInformado = pedido.emailInformado;
    }

    // Stringify the object and encode it in Base64 without encodeURIComponent
    let compressedPedido = btoa(JSON.stringify(pedidoGeral));

    if (pdf) arquivo = "enviar-pedido.php";
    if (!pdf && xlsx) arquivo = "enviar-planilha.php";
    console.log(compressedPedido);
    // Send the compressed string
    return this.servidorProvider.post(arquivo, { pedido: compressedPedido });
  }

  private preencherObjetoList(linhas: any, subscriber: any) {
    console.log("preencherObjetoList");
    if (linhas.length > 0) {
      let lstRetorno = new Array<IPedidos>();
      for (let i = 0; i < linhas.length; i++) {
        let obj = this.preencherObjeto(linhas.item(i));
        console.log('obj.cliCodigo', obj.cliCodigo);
        this.clienteProvider.porCodigo(obj.cliCodigo).subscribe((cliente) => {
          console.log('cliente', cliente);
          obj.cliente = cliente;
          this.transportadoraProvider
            .porCodigo(obj.traCodigo)
            .subscribe((transportadora) => {
              obj.transportadora = transportadora;
              this.condicaoPagtoProvider
                .porCodigo(obj.cpgCodigo)
                .subscribe((condicaoPagto) => {
                  obj.condicaoPagto = condicaoPagto;
                  lstRetorno.push(obj);
                  if (lstRetorno.length == linhas.length) {
                    UtilProvider.completarObservable(subscriber, lstRetorno);
                  }
                });
            });
        });
      }
    } else {
      UtilProvider.completarObservable(subscriber, new Array<IPedidos>());
    }
  }

  private preencherObjeto(linha: any): IPedidos {
    let pedido = <IPedidos>linha;
    pedido.data = UtilProvider.converterData(linha.data);
    pedido.dtAlteracao = UtilProvider.converterData(linha.dtAlteracao);
    pedido.dtEnvio = UtilProvider.converterData(linha.dtEnvio);
    return pedido;
  }

  public converterStatus(status: string): number {
    switch (status.toLocaleUpperCase()) {
      case "L":
        return 11;
      case "S":
        return 12;
      case "C":
        return 13;
      case "P":
        return 14;
      case "F":
        return 15;
      case "2":
        return 2;
      default:
        return 10;
    }
  }

  public converterStatusNomes(status: number): string {
    switch (status) {
      case 1:
        return 'NÃO ENVIADO';
      case 2:
        return 'ENVIADO';
      case 10:
        return 'NÃO LIBERADO';
      case 11:
        return 'LIBERADO';
      case 12:
        return 'EM SEPARAÇÃO';
      case 13:
        return 'PREP. PARCIAL';
      case 14:
        return 'PREPARADO';
      case 15:
        return 'FATURADO';
    }
    return '';
  }
}
