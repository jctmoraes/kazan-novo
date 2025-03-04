import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';

import { PageRoutingModule } from './pages-routing.module';
import { StorageService } from '../services/storage.service';
import { ServidorProvider } from '../services/servidor-provider';
import { TransportadorasProvider } from '../services/transportadoras-provider';
import { StatusPedidoProvider } from '../services/status-pedido';
import { SincronizacaoProvider } from '../services/sincronizacao-provider';
import { PedidosProvider } from '../services/pedidos-provider';
import { PedidosItensProvider } from '../services/pedidos-itens-provider';
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
import { TransportadoraPage } from './transportadora/transportadora';
import { TabelaPrecoPage } from './tabela-preco/tabela-preco';
import { SelecionaFilialComponent } from './seleciona-filial/seleciona-filial';
import { ProdutoQtdPage } from './produto-qtd/produto-qtd';
import { ProdutoDetalhePage } from './produto-detalhe/produto-detalhe';
import { ProdutoPage } from './produto/produto';
import { PedidoPlanilhaPage } from './pedido-planilha/pedido-planilha';
import { PedidoEmailPage } from './pedido-email/pedido-email';
import { PedidoDetalhePage } from './pedido-detalhe/pedido-detalhe';
import { PedidoPage } from './pedido/pedido';
import { MasterPage } from './master/master';
import { HomePage } from './home/home.page';
import { FinalizaPedidoPage } from './finaliza-pedido/finaliza-pedido';
import { PedidoFiltroPage } from './filtro/pedido-filtro/pedido-filtro';
import { FaleConoscoPage } from './fale-conosco/fale-conosco';
import { CondicaoPagtoPage } from './condicao-pagto/condicao-pagto';
import { ClienteSelecionaPage } from './cliente-seleciona/cliente-seleciona';
import { ClienteDetalhePage } from './cliente-detalhe/cliente-detalhe';
import { ClienteCadastroPage } from './cliente-cadastro/cliente-cadastro';
import { ClientePage } from './cliente/cliente';
import { CarrinhoPage } from './carrinho/carrinho';
import { RouteReuseStrategy } from '@angular/router';

@NgModule({
  declarations: [
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
    CommonModule,
    FormsModule,
    IonicModule, // Certifique-se de que o IonicModule está importado
    PageRoutingModule,
    ReactiveFormsModule,
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
    SQLite,
    SQLitePorter, // Add this line
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
    provideHttpClient(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PagesModule {}
