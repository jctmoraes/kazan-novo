import { ChangeDetectorRef, Injectable } from "@angular/core";
import { forkJoin, from, mergeMap, Observable, of, Subscriber, tap } from "rxjs";
import { Storage } from "@ionic/storage";
import { UtilProvider } from "./util-provider";
import { ClientesProvider } from "./clientes-provider";
import { ItensProvider } from "./itens-provider";
import { TransportadorasProvider } from "./transportadoras-provider";
import { IvaProvider } from "./iva-provider";
import { CondicaoPagtoProvider } from "./condicaoPagto-provider";
import { CodigoBarrasProvider } from "./codigoBarras-provider";
import { FabricantesProvider } from "./fabricantes-provider";
import { ConfiguracaoProvider } from "./configuracao-provider";
import { EstoqueProvider } from "./estoque-provider";
import { FaixaDescontosProvider } from "./faixaDescontos-provider";
import { ClicadastradosProvider } from "./clicadastrados-provider";
import { FiliaisProvider } from "./filiais-provider";
import { StorageService } from "./storage.service";

@Injectable({ providedIn: 'root' })
export class SincronizacaoProvider {
  _sincronizacao = {
    clientes: false,
    condicaoPagto: false,
    codigoBarras: false,
    fabricantes: false,
    itens: false,
    iva: false,
    transportadoras: false,
    configuracao: false,
    faixadescontos: false,
    cliCadastrados: false,
    filiais: false,
    estoque: false,
  };
  _codigo: number = 0;
  _loading: HTMLIonLoadingElement;
  _forcar: boolean = false;
  _mensagem: string = "";

  constructor(
    private storageService: StorageService,
    private utilProvider: UtilProvider,
    private clienteProvider: ClientesProvider,
    private itemProvider: ItensProvider,
    private transportadoraProvider: TransportadorasProvider,
    private ivaProvider: IvaProvider,
    private condicaoPagtoProvider: CondicaoPagtoProvider,
    private codigoBarrasProvider: CodigoBarrasProvider,
    private fabricantesProvider: FabricantesProvider,
    private configuracaoProvider: ConfiguracaoProvider,
    private faixaDescontosProvider: FaixaDescontosProvider,
    private cliCadastradosProvider: ClicadastradosProvider,
    private filiaisProvider: FiliaisProvider,
    private estoqueProvider: EstoqueProvider,
  ) {}

  async sincronizar(
    codigo: number,
    vendaProdImp: string,
    forcar: boolean,
    cdr: ChangeDetectorRef,
  ) {
    this._codigo = codigo;
    this._forcar = forcar;
    this._mensagem = "SINCRONIZANDO...";
    if (forcar) {
      await this.continuarSincronizacao(vendaProdImp, cdr); // Passando o cdr
    } else {
      const dtm = await this.buscarDtSincronizacao("UltSincronizacao" + this._codigo);
      console.log("Data da última sincronização:", dtm);
      let dtmAtual: Date = new Date();
      if (dtm != null) {
        let horasSemSincronizar: number =
          Math.abs(dtmAtual.getTime() - dtm.getTime()) / (1000 * 60 * 60);
        let tempoAtualizacao: number = 24;
        console.log("Horas sem sincronizar:", horasSemSincronizar);
        if (horasSemSincronizar >= tempoAtualizacao) {
          this._forcar = true;
          this.continuarSincronizacao(vendaProdImp, cdr); // Passando o cdr
        } else if (horasSemSincronizar > 4) {
          this._sincronizacao.clientes = true;
          this._sincronizacao.itens = true;
          this._sincronizacao.transportadoras = true;
          this._sincronizacao.condicaoPagto = true;
          this._sincronizacao.codigoBarras = true;
          this._sincronizacao.fabricantes = true;
          this._sincronizacao.iva = true;
          this._sincronizacao.estoque = true;
          this._sincronizacao.faixadescontos = true;
          this._sincronizacao.cliCadastrados = true;
          this._sincronizacao.filiais = true;
          this._sincronizacao.estoque = true;
          this._loading = await this.utilProvider.mostrarCarregando(
            this._mensagem,
          );
          this.sincronizarConfiguracao();
        }
      } else {
        this._forcar = true;
        this.continuarSincronizacao(vendaProdImp, cdr); // Passando o cdr
      }
    }
  }

  sincronizarConfiguracao() {
    console.log('Sincronizando configuração...');
    this.configuracaoProvider.sincronizar().subscribe(
      (configuracao) => {
        UtilProvider.configuracao = configuracao;
        this._mensagem += "<br>CONF. SINCRONIZADA";
      },
      (err) => {
        alert("erro: " + err);
      },
      () => {
        this._sincronizacao.configuracao = true;
        this.verificarFinalizacao(this._mensagem);
      },
    );
  }

  async continuarSincronizacao(vendaProdImp: string, cdr: ChangeDetectorRef) {
    this._loading = await this.utilProvider.mostrarCarregando(this._mensagem);

    const sincronizacoes = [
      this.clienteProvider.sincronizar(this._codigo).pipe(tap(() => {
        this._mensagem += "<br>CLIENTES SINCRONIZADOS";
        this._sincronizacao.clientes = true;
      })),
      this.itemProvider.sincronizar(vendaProdImp).pipe(tap(() => {
        this._mensagem += "<br>PROD. SINCRONIZADOS";
        this._sincronizacao.itens = true;
      })),
      this.transportadoraProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>TRANSP. SINCRONIZADAS";
        this._sincronizacao.transportadoras = true;
      })),
      this.ivaProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>IVAS SINCRONIZADOS";
        this._sincronizacao.iva = true;
      })),
      this.condicaoPagtoProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>COND. PAGTOS SINCRONIZADOS";
        this._sincronizacao.condicaoPagto = true;
      })),
      this.codigoBarrasProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>CÓD. BAR. SINCRONIZADOS";
        this._sincronizacao.codigoBarras = true;
      })),
      this.fabricantesProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>FAB. SINCRONIZADOS";
        this._sincronizacao.fabricantes = true;
      })),
      this.faixaDescontosProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>FAIXA DESC. SINCRONIZADAS";
        this._sincronizacao.faixadescontos = true;
      })),
      this.cliCadastradosProvider.sincronizar(this._codigo).pipe(tap(() => {
        this._mensagem += "<br>CLIENTES CADASTRADOS SINCRONIZADOS";
        this._sincronizacao.cliCadastrados = true;
      })),
      this.filiaisProvider.sincronizar().pipe(tap(() => {
        this._mensagem += "<br>FILIAIS SINCRONIZADAS";
        this._sincronizacao.filiais = true;
      })),
    ];

    forkJoin(sincronizacoes).subscribe(
      () => {
        this._mensagem += "<br>TODAS AS SINCRONIZAÇÕES CONCLUÍDAS";
        this.sincronizarEstoque(); // Sincroniza o estoque, se necessário
        this.sincronizarConfiguracao();
      },
      (err) => {
        alert("Erro em uma ou mais sincronizações: " + err);
      },
      () => {
        this._loading.dismiss(); // Fecha o carregamento
        cdr.detectChanges(); // Atualiza o componente explicitamente
      },
    );
  }


  async sincronizarEstoque() {
    try {
      // Obtém o estoque usando o método getEstoque
      const estoques: any = await this.itemProvider.getEstoque();
      // console.log("Dados recebidos do getEstoque:", JSON.stringify(estoques));

      // Salva os estoques em massa no banco de dados
      const result = await this.estoqueProvider.salvar(estoques).toPromise();

      if (result) {
        console.log("Sincronização de estoque concluída com sucesso.");
      } else {
        console.error("Falha ao sincronizar estoque.");
      }

      // Define a sincronização como concluída e verifica a finalização
      this._sincronizacao.estoque = true;
      this.verificarFinalizacao(this._mensagem);
    } catch (error) {
      console.error("Erro ao sincronizar estoque:", error);
    }
  }

  verificarFinalizacao(mensagem: string) {
    this._loading.message = mensagem;
    console.log('this._sincronizacao.clientes', this._sincronizacao.clientes);
    console.log('this._sincronizacao.itens', this._sincronizacao.itens);
    console.log('this._sincronizacao.transportadoras', this._sincronizacao.transportadoras);
    console.log('this._sincronizacao.condicaoPagto', this._sincronizacao.condicaoPagto);
    console.log('this._sincronizacao.codigoBarras', this._sincronizacao.codigoBarras);
    console.log('this._sincronizacao.fabricantes', this._sincronizacao.fabricantes);
    console.log('this._sincronizacao.iva', this._sincronizacao.iva);
    console.log('this._sincronizacao.configuracao', this._sincronizacao.configuracao);
    console.log('this._sincronizacao.faixadescontos', this._sincronizacao.faixadescontos);
    console.log('this._sincronizacao.cliCadastrados', this._sincronizacao.cliCadastrados);
    console.log('this._sincronizacao.filiais', this._sincronizacao.filiais);
    console.log('this._sincronizacao.estoque', this._sincronizacao.estoque);
    if (
      this._sincronizacao.clientes &&
      this._sincronizacao.itens &&
      this._sincronizacao.transportadoras &&
      this._sincronizacao.condicaoPagto &&
      this._sincronizacao.codigoBarras &&
      this._sincronizacao.fabricantes &&
      this._sincronizacao.iva &&
      this._sincronizacao.configuracao &&
      this._sincronizacao.faixadescontos &&
      this._sincronizacao.cliCadastrados &&
      this._sincronizacao.filiais &&
      this._sincronizacao.estoque
    ) {
      console.log("Sincronização concluída.");
      if (this._forcar) {
        this.inserirDtSincronizacao(
          "UltSincronizacao" + this._codigo,
          new Date(),
        ).then(() => {
          this.finalizarSincronizacao();
        });
      } else {
        this.finalizarSincronizacao();
      }
    }
  }

  async buscarDtSincronizacao(chave: string): Promise<Date> {
    const retorno = await this.storageService.get("dtm" + chave);
    console.log("Data de sincronização:", retorno);
    return new Date(retorno);
  }

  async inserirDtSincronizacao(chave: string, valor: Date): Promise<void> {
    await this.storageService.set("dtm" + chave, valor);
  }

  finalizarSincronizacao() {
    this._sincronizacao.clientes = false;
    this._sincronizacao.itens = false;
    this._sincronizacao.transportadoras = false;
    this._sincronizacao.condicaoPagto = false;
    this._sincronizacao.codigoBarras = false;
    this._sincronizacao.fabricantes = false;
    this._sincronizacao.iva = false;
    this._sincronizacao.configuracao = false;
    this._sincronizacao.faixadescontos = false;
    this._sincronizacao.cliCadastrados = false;
    this._sincronizacao.filiais = false;
    this._sincronizacao.estoque = false;
    this._forcar = false;
    setTimeout(() => {
      this.utilProvider.esconderCarregando(this._loading);
      // UtilProvider.completarObservable(this._subscriber, "OK");
    }, 2000);
  }

  converteHora(h: string) {
    const decimalTimeString = h;
    let decimalTime = parseFloat(decimalTimeString);
    decimalTime = decimalTime * 60 * 60;
    let hours = Math.floor(decimalTime / (60 * 60));
    decimalTime = decimalTime - hours * 60 * 60;
    let minutes = Math.floor(decimalTime / 60);
    decimalTime = decimalTime - minutes * 60;
    let seconds = Math.round(decimalTime);

    let hr, mm, seg: string;
    if (hours < 10) {
      hr = "0" + hours;
    }
    if (minutes < 10) {
      mm = "0" + minutes;
    }
    if (seconds < 10) {
      seg = "0" + seconds;
    }

    return hr + ":" + mm;
  }
}
