import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ServidorProvider } from "./servidor-provider";
import { IItens } from "../interfaces/itens.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IFabricantes } from "../interfaces/fabricantes.interface";
import { IEstoque } from "../interfaces/estoque.interface";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";
import { HttpClient } from "@angular/common/http";
import * as pako from 'pako';

@Injectable({ providedIn: 'root' })
export class ItensProvider extends ComandoProvider {
  private _arquivo: string = "itens.php";
  private _est: string = "estoque.php";

  constructor(
    private http: HttpClient,
    private servidor: ServidorProvider,
    sqlite: SQLite
  ) {
    super("itens", new IItens(), sqlite);
  }

  salvar(cliente: IItens): Observable<boolean> {
    return new Observable((subs) => {
      this.insert(cliente).subscribe(
        (retorno: { insertId: number; success: boolean }) => {
          UtilProvider.completarObservable(subs, retorno);
        },
      );
    });
  }

  porCodigo(codigo: number): Observable<IItens> {
    return new Observable((subs) => {
      super
        .executeSql(
          `SELECT i.codigo, i.nome, imagem, fabCodigo, embalagem, valor, desconto, descQtd, ipi, claFiscal, codTributacao, codCest, codBarras, qtdMax, estoque, descLimite, f.nome AS fabricante
                        FROM itens i
                        INNER JOIN fabricantes f ON f.codigo = i.fabCodigo
                        WHERE i.codigo = ${codigo}`,
        )
        .subscribe((retorno) => {
          let obj: IItens | null = null;
          if (retorno.rows.length > 0) {
            obj = this.preencherObjeto(retorno.rows.item(0));
          }
          UtilProvider.completarObservable(subs, obj);
        });
    });
  }

  buscar(
    filtro: string,
    inicio: number,
    qtd: number,
    total: boolean,
  ): Observable<IItens[]> {
    return new Observable((subs) => {
      let select = "SELECT ";
      let from =
        " FROM itens i INNER JOIN fabricantes f ON f.codigo = i.fabCodigo";
      let where = "";

      if (total) select += " COUNT(i.codigo) AS qtd";
      else
        select +=
          " i.codigo, i.nome, imagem, fabCodigo, embalagem, valor, desconto, descQtd, ipi, claFiscal, codTributacao, codCest, codBarras, qtdMax, estoque, descLimite, f.nome AS fabricante";

      if (filtro != "") {
        if (UtilProvider.validarNumero(filtro)) {
          where +=
            " WHERE i.codigo = " +
            filtro +
            ' OR i.codBarras = "' +
            filtro +
            '" OR i.codigo IN(SELECT cb.proCodigo FROM codigoBarras cb WHERE cb.codBarras = "' +
            filtro +
            '")';
        } else {
          where += " WHERE (i.nome LIKE '%" + filtro + "%')";
        }
      }
      if (!total) {
        where += " ORDER BY i.nome ASC";
        where += " LIMIT " + inicio + ", " + qtd;
      }
      //
      // console.log(select + from + where)
      super.executeSql(select + from + where).subscribe(
        (retorno) => {
          if (total) {
            // console.log('Qtd', retorno.rows.item(0));
            UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
          } else this.preencherObjetoList(retorno.rows, subs);
        },
        (err) => {
          console.log("err: " + err);
        },
      );
    });
  }
  buscarTodos(): Observable<IItens[]> {
    return new Observable((subs) => {
      // Consulta SQL para selecionar todos os itens
      const sql = `SELECT i.codigo, i.nome, imagem, fabCodigo, embalagem, valor, desconto, descQtd, ipi, claFiscal, codTributacao, codCest, codBarras, qtdMax, estoque, descLimite, f.nome AS fabricante
                   FROM itens i
                   INNER JOIN fabricantes f ON f.codigo = i.fabCodigo
                   ORDER BY i.nome ASC`;

      // Executa a consulta SQL
      super.executeSql(sql).subscribe(
        (retorno) => {
          this.preencherObjetoList(retorno.rows, subs);
        },
        (err) => {
          console.log("Erro ao buscar todos os itens: ", err);
          UtilProvider.completarObservable(subs, []);
        },
      );
    });
  }
  buscarQuantidade(funCodigo: number, banco: number): Observable<number> {
    return new Observable((subs) => {
      super
        .selectCount("codigo", { funCodigo: funCodigo, banco: banco })
        .subscribe((retorno) => {
          UtilProvider.completarObservable(subs, retorno);
        });
    });
  }

  excluir(): Observable<boolean> {
    return super.delete({});
  }

  sincronizar(vendaProdImp: string): Observable<IItens[]> {
    return new Observable<IItens[]>((subs) => {
      const isSomenteProdutoImportado =
        this.isSomenteProdutoImportado(vendaProdImp);
      const arquivoParam =
        this._arquivo + "?somenteImportado=" + isSomenteProdutoImportado;
      this.servidor.get(arquivoParam).subscribe(
        (data) => {
          this.excluir().subscribe(() => {
            this.importJson(data).subscribe(
              () => {},
              (err) => alert("Erro na importação dos itens: " + err),
              () => UtilProvider.completarObservable(subs, true),
            );
          });
        },
        () => UtilProvider.completarObservable(subs, false),
      );
    });
  }

  getEstoque_old(pCod: number): Observable<IEstoque[]> {
    return new Observable<IEstoque[]>((subs) => {
      this.servidor.get(this._est + "?proCodigo=" + pCod).subscribe((x) => {
        console.log("Buscando Estoque: ", x);
      });
    });
  }
  async getEstoque(): Promise<any> {
    try {
      const response = await this.http
        .get("https://api.afkgestao.com.br/kazan/estoque.php", {
          responseType: "arraybuffer",
        })
        .toPromise();

      if (!response) {
        throw new Error("Response is undefined");
      }

      const decompressedData = pako.inflate(new Uint8Array(response), {
        to: "string",
      });

      const jsonData = JSON.parse(decompressedData);
      console.log("get estoque antes da sinc" + jsonData);
      return jsonData;
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      throw error;
    }
  }

  private preencherObjetoList(linhas: any, subscriber: any) {
    if (linhas.length > 0) {
      let lstRetorno = new Array<IItens>();
      for (let i = 0; i < linhas.length; i++) {
        let obj = this.preencherObjeto(linhas.item(i));
        lstRetorno.push(obj);
        if (lstRetorno.length == linhas.length) {
          UtilProvider.completarObservable(subscriber, lstRetorno);
        }
      }
    } else {
      UtilProvider.completarObservable(subscriber, new Array<IItens>());
    }
  }

  private preencherObjeto(linha: any): IItens {
    console.log("linha", JSON.stringify(linha));
    let item = <IItens>linha;
    //console.log('linha', JSON.stringify(linha));
    if (linha.fabricante != null) {
      item.fabricante = <IFabricantes>{ nome: linha.fabricante };
    }
    return item;
  }

  private isSomenteProdutoImportado(vendaProdImp: string) {
    return (
      vendaProdImp !== null &&
      vendaProdImp !== undefined &&
      vendaProdImp.toUpperCase() === "S"
    );
  }
}
