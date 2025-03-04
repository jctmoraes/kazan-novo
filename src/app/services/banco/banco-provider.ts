import { Injectable } from "@angular/core";
import { ComandoProvider } from "./comando-provider";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class BancoProvider extends ComandoProvider {
  constructor(banco: SQLite) {
    super("", null, banco);
  }

  async criarTabela(): Promise<void> {
    await super
      .importSqlPromise(
        "CREATE TABLE IF NOT EXISTS funcionarios (codigo INTEGER, situacao TEXT, filial INTEGER, nome TEXT, endereco TEXT, bairro TEXT, cidade TEXT, estado TEXT, cep TEXT, telefone TEXT, contato TEXT, cnpj TEXT, ie TEXT, senha TEXT, comissao INTEGER, logado NUMERIC, vendaProdImp TEXT);" +
          "CREATE TABLE IF NOT EXISTS clientes (codigo INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, endereco TEXT, numero TEXT, bairro TEXT, cidade TEXT, estado TEXT, cep TEXT, cnpj TEXT, ie TEXT, tipoPessoa TEXT, venCodigo INTEGER, limite NUMERIC, email TEXT, telefone INTEGER, telefone2 TEXT, fax TEXT, contato TEXT, telefoneContato TEXT, traCodigo INTEGER, cpgCodigo TEXT, bloqueado NUMERIC, tipo TEXT, totalReceber NUMERIC, totalCheque NUMERIC, vencidoReceber NUMERIC, vencidoCheque NUMERIC);" +
          "CREATE TABLE IF NOT EXISTS clienteCadastro (codigo INTEGER PRIMARY KEY, data NUMERIC, fisJur TEXT, cgcCpf TEXT, razao TEXT, endereco TEXT, numEnd TEXT, complemento TEXT, bairro TEXT, cidade TEXT, estado TEXT, cep TEXT, fone1 TEXT, fone2 TEXT, fax TEXT, contato TEXT, inscRg TEXT, codVen TEXT, email TEXT, status TEXT, ddd1 TEXT,ddd2 TEXT);" +
          "CREATE TABLE IF NOT EXISTS itens (codigo INTEGER, nome TEXT, imagem TEXT, fabCodigo INTEGER, embalagem TEXT, valor NUMERIC, desconto INTEGER, descQtd INTEGER, ipi INTEGER, claFiscal INTEGER, codTributacao TEXT, codCest TEXT, codBarras TEXT, qtdMax INTEGER, descLimite NUMERIC, estoque NUMERIC);" +
          "CREATE TABLE IF NOT EXISTS codigoBarras (proCodigo INTEGER, codBarras TEXT);" +
          "CREATE TABLE IF NOT EXISTS transportadoras (codigo INTEGER, nome TEXT, perDesc INTEGER, perAcres INTEGER);" +
          "CREATE TABLE IF NOT EXISTS pedidos (codigo INTEGER, data NUMERIC, venCodigo INTEGER, traCodigo INTEGER, cliCodigo INTEGER, cpgCodigo TEXT, valor NUMERIC, status INTEGER, desconto NUMERIC, dtAlteracao NUMERIC, dtEnvio NUMERIC, observacao TEXT, numero INTEGER, frete TEXT, filial INTEGER, nomeFilial TEXT);" +
          "CREATE TABLE IF NOT EXISTS pedidosItens (sequencia INTEGER, empresa INTEGER, pedCodigo INTEGER, iteCodigo INTEGER, quantidade INTEGER, valor NUMERIC, valorUnitario NUMERIC, desconto NUMERIC, valorIpi NUMERIC, valorSt NUMERIC, baseSt NUMERIC, total NUMERIC, ipi INTEGER, dolar NUMERIC, aliqIcms NUMERIC, cst TEXT, valorDesc NUMERIC);" +
          "CREATE TABLE IF NOT EXISTS iva (codigo INTEGER, ufDest TEXT, perIvaImp INTEGER, perIva INTEGER, aliqInterna INTEGER, aliqExtImp INTEGER, aliqExterna INTEGER, perIvaOrig INTEGER);" +
          "CREATE TABLE IF NOT EXISTS condicaoPagto (codigo INTEGER, descricao TEXT, desconto INTEGER, acrescimo NUMERIC, valMinimo NUMERIC);" +
          "CREATE TABLE IF NOT EXISTS fabricantes (codigo INTEGER, nome TEXT);" +
          "CREATE TABLE IF NOT EXISTS fotos (proCodigo INTEGER, imagem1 TEXT, imagem2 TEXT, imagem3 TEXT, imagem4 TEXT);" +
          "CREATE TABLE IF NOT EXISTS configuracao (embalagemMin TEXT, descInterestadual INTEGER);" +
          "CREATE TABLE IF NOT EXISTS faixadescontos (filial INTEGER, faixa INTEGER, valde NUMERIC, valate NUMERIC, perdesc NUMERIC);" +
          "CREATE TABLE IF NOT EXISTS cliCadastrados (codigo INTEGER, cnpj TEXT);" +
          "CREATE TABLE IF NOT EXISTS estoque (id INTEGER PRIMARY KEY AUTOINCREMENT, cod_produto INTEGER, cod_filial INTEGER, quantidade INTEGER, UNIQUE(cod_produto, cod_filial));",
      );

    await super
      .importSqlPromise(
        // Tenta adicionar a coluna 'qtdFat', mas ignora se já existir
        `CREATE TABLE IF NOT EXISTS filiais (codigo INTEGER, codEmp INTEGER, razao TEXT, nomeFantasia TEXT);
          ALTER TABLE pedidosItens ADD COLUMN qtdFat INTEGER;`,
      );
  }

  async verificarTabelas(): Promise<boolean> {
    const tabelas = [
      "funcionarios",
      "clientes",
      "itens",
      "codigoBarras",
      "transportadoras",
      "pedidos",
      "pedidosItens",
      "iva",
      "condicaoPagto",
      "fabricantes",
      "fotos",
      "configuracao",
      "faixadescontos",
      "cliCadastrados",
      "estoque",
    ];

    // Verifica cada tabela para ver se está vazia
    for (const tabela of tabelas) {
      const result = await super
        .selectPersonalizadoPromise(`COUNT(*) AS total`, tabela, `1=1`);

      const total = result.rows.item(0).total;

      // Se alguma tabela estiver vazia, precisa sincronizar
      if (total === 0) {
        return true;
      }
    }

    return false;
  }
}
