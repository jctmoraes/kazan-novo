import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import { ComponentsModule } from './components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { PedidoEmailProvider } from '@services/pedido-email.provider';
import { CondicaoPagtoProvider } from '@services/condicaoPagto-provider';
import { ClicadastradosProvider } from '@services/clicadastrados-provider';
import { FuncionariosProvider } from '@services/funcionarios-provider';
import { ClientesProvider } from '@services/clientes-provider';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { SQLitePorter } from '@awesome-cordova-plugins/sqlite-porter/ngx';
import { FabricantesProvider } from '@services/fabricantes-provider';
import { EstoqueProvider } from '@services/estoque-provider';
import { ConfiguracaoProvider } from '@services/configuracao-provider';
import { FaixaDescontosProvider } from '@services/faixaDescontos-provider';
import { FiliaisProvider } from '@services/filiais-provider';
import { FotosProvider } from '@services/fotos-provider';
import { ItensProvider } from '@services/itens-provider';
import { IvaProvider } from '@services/iva-provider';
import { UtilProvider } from '@services/util-provider';
import { CarrinhoPage } from './pages/carrinho/carrinho';
import { ClientePage } from './pages/cliente/cliente';
import { ClienteCadastroPage } from './pages/cliente-cadastro/cliente-cadastro';
import { ClienteDetalhePage } from './pages/cliente-detalhe/cliente-detalhe';
import { ClienteSelecionaPage } from './pages/cliente-seleciona/cliente-seleciona';
import { CondicaoPagtoPage } from './pages/condicao-pagto/condicao-pagto';
import { FaleConoscoPage } from './pages/fale-conosco/fale-conosco';
import { PedidoFiltroPage } from './pages/filtro/pedido-filtro/pedido-filtro';
import { FinalizaPedidoPage } from './pages/finaliza-pedido/finaliza-pedido';
import { MasterPage } from './pages/master/master';
import { PedidoPage } from './pages/pedido/pedido';
import { PedidoDetalhePage } from './pages/pedido-detalhe/pedido-detalhe';
import { PedidoEmailPage } from './pages/pedido-email/pedido-email';
import { PedidoPlanilhaPage } from './pages/pedido-planilha/pedido-planilha';
import { ProdutoPage } from './pages/produto/produto';
import { ProdutoDetalhePage } from './pages/produto-detalhe/produto-detalhe';
import { ProdutoQtdPage } from './pages/produto-qtd/produto-qtd';
import { SelecionaFilialComponent } from './pages/seleciona-filial/seleciona-filial';
import { TabelaPrecoPage } from './pages/tabela-preco/tabela-preco';
import { TransportadoraPage } from './pages/transportadora/transportadora';
import { CommonModule } from '@angular/common';
import { StorageService } from '@services/storage.service';
import { ServidorProvider } from '@services/servidor-provider';
import { TransportadorasProvider } from '@services/transportadoras-provider';
import { StatusPedidoProvider } from '@services/status-pedido';
import { SincronizacaoProvider } from '@services/sincronizacao-provider';
import { PedidosProvider } from '@services/pedidos-provider';
import { PedidosItensProvider } from '@services/pedidos-itens-provider';
import { HomePage } from './pages/home/home.page';
import { ReaisPipe } from './pipes/reais.pipe';
import { FilialSelecionadaService } from '@services/filial-selecionada.service';

@NgModule({
  declarations: [
    AppComponent,
    CarrinhoPage,
    ClientePage,
    ClienteCadastroPage,
    ClienteDetalhePage,
    ClienteSelecionaPage,
    CondicaoPagtoPage,
    FaleConoscoPage,
    PedidoFiltroPage,
    FinalizaPedidoPage,
    HomePage,
    MasterPage,
    PedidoPage,
    PedidoDetalhePage,
    PedidoEmailPage,
    PedidoPlanilhaPage,
    ProdutoPage,
    ProdutoDetalhePage,
    ProdutoQtdPage,
    SelecionaFilialComponent,
    TabelaPrecoPage,
    TransportadoraPage,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    IonicStorageModule.forRoot({
      name: '__mydb',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    }),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
  ],
  exports: [
    CarrinhoPage,
    ClientePage,
    ClienteCadastroPage,
    ClienteDetalhePage,
    ClienteSelecionaPage,
    CondicaoPagtoPage,
    FaleConoscoPage,
    PedidoFiltroPage,
    FinalizaPedidoPage,
    HomePage,
    MasterPage,
    PedidoPage,
    PedidoDetalhePage,
    PedidoEmailPage,
    PedidoPlanilhaPage,
    ProdutoPage,
    ProdutoDetalhePage,
    ProdutoQtdPage,
    SelecionaFilialComponent,
    TabelaPrecoPage,
    TransportadoraPage,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SQLite,
    SQLitePorter,
    StorageService,
    ServidorProvider,
    TransportadorasProvider,
    StatusPedidoProvider,
    SincronizacaoProvider,
    PedidosProvider,
    PedidosItensProvider,
    PedidoEmailProvider,
    CondicaoPagtoProvider,
    ClicadastradosProvider,
    ClientesProvider,
    FuncionariosProvider,
    FabricantesProvider,
    EstoqueProvider,
    ConfiguracaoProvider,
    FaixaDescontosProvider,
    FiliaisProvider,
    FotosProvider,
    ItensProvider,
    IvaProvider,
    UtilProvider,
    FilialSelecionadaService,
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
