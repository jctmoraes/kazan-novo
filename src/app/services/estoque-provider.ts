import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IEstoque } from "../interfaces/estoque.interface";
import { SQLite, SQLiteObject } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class EstoqueProvider extends ComandoProvider {
  private _arquivo: string = "estoque.php";

  constructor(
    private servidor: ServidorProvider,
    sqlite: SQLite
  ) {
    super("estoque", new IEstoque(), sqlite);
  }
  salvar(estoques: IEstoque[]): Observable<boolean> {
    return new Observable((observer) => {
      if (!estoques || estoques.length === 0) {
        console.error("Nenhum estoque fornecido para salvar.");
        UtilProvider.completarObservable(observer, false);
        return;
      }

      // Divida o array de estoques em lotes menores
      const batchSize = 50; // Tamanho do lote pode ser ajustado
      const batches: IEstoque[][] = [];
      for (let i = 0; i < estoques.length; i += batchSize) {
        batches.push(estoques.slice(i, i + batchSize));
      }

      // Execute em segundo plano
      setTimeout(() => {
        this.conectar().then(
          (db: SQLiteObject) => {
            const processBatch = (batch: IEstoque[]) => {
              // Usa map para criar um array de arrays de consultas
              const queries = batch.map((estoque) => [
                ["DELETE FROM estoque WHERE cod_produto = ? AND cod_filial = ?", [estoque.codProduto, estoque.codFilial]],
                ["INSERT INTO estoque (cod_produto, cod_filial, quantidade) VALUES (?, ?, ?)", [
                  estoque.codProduto,
                  estoque.codFilial,
                  estoque.Estoque
                ]]
              ]);

              // Função auxiliar para achatar o array
              const flatten = (array: any[][]) => {
                return array.reduce((acc, val) => acc.concat(val), []);
              };

              return db.sqlBatch(flatten(queries));
            };

            // Processa todos os lotes sequencialmente
            batches.reduce((promise, batch) => {
              return promise.then(() => processBatch(batch));
            }, Promise.resolve())
              .then(() => {
                UtilProvider.completarObservable(observer, true);
              })
              .catch((error) => {
                console.error("Erro ao salvar em massa:", JSON.stringify(error));
                UtilProvider.completarObservable(observer, false);
              });
          },
          (error) => {
            console.error("Erro ao conectar ao banco de dados:", JSON.stringify(error));
            UtilProvider.completarObservable(observer, false);
          }
        );
      }, 0); // Executar após o evento de loop principal
    });
  }


  private executeSqlEmSegundoPlano(callback: () => void) {
    setTimeout(callback, 0); // Simula execução em segundo plano
  }

  salvarEmMassa(estoques: IEstoque[]): Observable<boolean> {
    return new Observable((subs) => {
      this.conectar().then((db: SQLiteObject) => {
        db.sqlBatch(
          estoques.map((estoque) => [
            "INSERT OR REPLACE INTO estoque (cod_produto, cod_filial, quantidade) VALUES (?, ?, ?)",
            [estoque.codProduto, estoque.codFilial, estoque.Estoque],
          ]),
        )
          .then(() => {
            UtilProvider.completarObservable(subs, true);
          })
          .catch((e) => {
            console.error("Erro ao salvar em massa:", JSON.stringify(e));
            UtilProvider.completarObservable(subs, false);
          });
      });
    });
  }

  porCodigo(codProduto: number, codFilial: number): Observable<IEstoque> {
    return new Observable((subs) => {
      // Evitar injeção de SQL: usar query parametrizada é recomendado, mas aqui incluiremos os parâmetros diretamente
      const sql = `SELECT id, cod_produto, cod_filial, quantidade
                   FROM estoque
                   WHERE cod_produto = ${codProduto} AND cod_filial = ${codFilial}`;
      console.log("SQL:", sql);

      super.executeSql(sql).subscribe((retorno) => {
        let obj: IEstoque | null = null;
        if (retorno.rows.length > 0) {
          obj = retorno.rows.item(0);
        }
        UtilProvider.completarObservable(subs, obj);
      });
    });
  }

  buscarEstoque(codProduto: number): Observable<IEstoque[]> {
    return new Observable((subs) => {
      const sql = `SELECT id, cod_produto, cod_filial, quantidade
                   FROM estoque
                   WHERE cod_produto = ${codProduto}`;

      super.executeSql(sql).subscribe((retorno) => {
        let estoqueList: IEstoque[] = [];
        for (let i = 0; i < retorno.rows.length; i++) {
          estoqueList.push(retorno.rows.item(i));
        }
        UtilProvider.completarObservable(subs, estoqueList);
      });
    });
  }

  excluirEstoque(): Observable<boolean> {
    return super.delete({});
  }

  sincronizar(): Observable<boolean> {
    return new Observable<boolean>((subs) => {
      this.servidor.get(this._arquivo).subscribe(
        (data) => {
          this.excluirEstoque().subscribe(() => {
            this.importJson(data).subscribe(
              () => {},
              (err) => alert("Erro na importação dos dados de estoque: " + err),
              () => UtilProvider.completarObservable(subs, true),
            );
          });
        },
        () => UtilProvider.completarObservable(subs, false),
      );
    });
  }

  protected override importJson(data: any): Observable<void> {
    return new Observable<void>((subs) => {
      if (data && Array.isArray(data)) {
        data.forEach((item) => {
          const estoque: any = {
            cod_produto: item.codProduto,
            cod_filial: item.codFilial,
            quantidade: item.estoque,
          };
          this.salvar(estoque).subscribe(
            () => {},
            (err) => console.error("Erro ao salvar estoque: ", err),
            () => UtilProvider.completarObservable(subs, true),
          );
        });
      } else {
        UtilProvider.completarObservable(subs, false);
      }
    });
  }
}
