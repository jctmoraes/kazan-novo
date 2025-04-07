import { Network } from '@capacitor/network';
import { Injectable } from "@angular/core";
import { IPedidos, IPedidosGeral } from "../interfaces/pedidos.interface";
import { IConfiguracao } from "../interfaces/configuracao.interface";
import { AlertController, LoadingController, ToastController } from "@ionic/angular";
import { IIva } from "../interfaces/iva.interface";
import { IValor } from "../interfaces/itens.interface";
import { IvaProvider } from "./iva-provider";
import { PedidosItensProvider } from "./pedidos-itens-provider";
import { Subscriber } from "rxjs";
import { IPedidosItens } from '@interfaces/pedidosItens.interface';
import { App } from '@capacitor/app';

@Injectable({ providedIn: 'root' })
export class UtilProvider {
  public static pedido: boolean = false;
  public static objPedido = new IPedidosGeral();
  public static funCodigo: number = 0;
  public static versao: string = "";
  public static configuracao = new IConfiguracao();

  constructor(
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  public static round(valor: number) {
    // console.log('Round: valor-', valor, ' *', Math.round(valor * 100), ' res- ', Math.round(valor * 100) / 100);
    return Math.round(valor * 100) / 100;
  }

  static validarNumero(n: string) {
    const num = parseFloat(n);
    return !isNaN(num) && isFinite(num);
  }

  formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  mascaraGlobal(mascara: string, valor: string) : string {
    if (mascara == "###.###.###-##|##.###.###/####-##") {
      if (valor.length > 14) {
        return this.mascaraGlobal("##.###.###/####-##", valor);
      } else {
        return this.mascaraGlobal("###.###.###-##", valor);
      }
    }

    let tvalor = "";
    let ret = "";
    let caracter = "#";
    let separador = "|";
    let mascara_utilizar = "";
    valor = this.removeEspacos(valor);
    if (valor == "") return valor;
    let temp = mascara.split(separador);
    let dif = 1000;

    //tirando mascara do valor já existente
    for (let i = 0; i < valor.length; i++) {
      if (!isNaN(valor.charCodeAt(i))) {
        tvalor = tvalor + valor.substr(i, 1);
      }
    }

    valor = tvalor;

    //formatar mascara dinamica
    for (let i = 0; i < temp.length; i++) {
      let mult = "";
      let validar = 0;
      for (let j = 0; j < temp[i].length; j++) {
        if (temp[i].substr(j, 1) == "]") {
          temp[i] = temp[i].substr(j + 1);
          break;
        }
        if (validar == 1) mult = mult + temp[i].substr(j, 1);
        if (temp[i].substr(j, 1) == "[") validar = 1;
      }
      for (let j = 0; j < valor.length; j++) {
        temp[i] = mult + temp[i];
      }
    }

    let tam = 0;
    //verificar qual mascara utilizar
    if (temp.length == 1) {
      mascara_utilizar = temp[0];
      let mascara_limpa = "";
      for (let j = 0; j < mascara_utilizar.length; j++) {
        if (mascara_utilizar.substr(j, 1) == caracter) {
          mascara_limpa = mascara_limpa + caracter;
        }
      }
      tam = mascara_limpa.length;
    } else {
      //limpar caracteres diferente do caracter da máscara
      for (let i = 0; i < temp.length; i++) {
        let mascara_limpa = "";
        for (let j = 0; j < temp[i].length; j++) {
          if (temp[i].substr(j, 1) == caracter) {
            mascara_limpa = mascara_limpa + caracter;
          }
        }
        if (valor.length > mascara_limpa.length) {
          if (dif > valor.length - mascara_limpa.length) {
            dif = valor.length - mascara_limpa.length;
            mascara_utilizar = temp[i];
            tam = mascara_limpa.length;
          }
        } else if (valor.length < mascara_limpa.length) {
          if (dif > mascara_limpa.length - valor.length) {
            dif = mascara_limpa.length - valor.length;
            mascara_utilizar = temp[i];
            tam = mascara_limpa.length;
          }
        } else {
          mascara_utilizar = temp[i];
          tam = mascara_limpa.length;
          break;
        }
      }
    }

    //validar tamanho da mascara de acordo com o tamanho do valor
    if (valor.length > tam) {
      valor = valor.substr(0, tam);
    } else if (valor.length < tam) {
      let masct = "";
      let j = valor.length;
      for (let i = mascara_utilizar.length - 1; i >= 0; i--) {
        if (j == 0) break;
        if (mascara_utilizar.substr(i, 1) == caracter) {
          j--;
        }
        masct = mascara_utilizar.substr(i, 1) + masct;
      }
      mascara_utilizar = masct;
    }

    //mascarar
    let j = mascara_utilizar.length - 1;
    for (let i = valor.length - 1; i >= 0; i--) {
      if (mascara_utilizar.substr(j, 1) != caracter) {
        ret = mascara_utilizar.substr(j, 1) + ret;
        j--;
      }
      ret = valor.substr(i, 1) + ret;
      j--;
    }
    return ret;
  }

  removeEspacos(valor: string) {
    let valorSemEspacos = "";
    let tamanho = valor.length;
    for (let i = 0; i < tamanho; i++) {
      if (valor.substr(i, 1) == " ") {
      } else {
        valorSemEspacos = valorSemEspacos + valor.substr(i, 1);
      }
    }
    return valorSemEspacos;
  }

  formatarCnpj(cnpj: string) {
    if (cnpj != "") {
      return this.formataCampo(cnpj, "00.000.000/0000-00");
    }
    return cnpj;
  }

  formatarTelefone(telefone: string) {
    console.log("Exibe telefone: ", telefone);
    if (telefone != "" && telefone != null) {
      console.log("Entrou telefone: ", telefone);
      telefone = telefone.toString().trim();
      telefone = this.replace(telefone, "-", "");
      telefone = this.replace(telefone, " ", "");
      let mascara = "(00)00000-0000";
      if (telefone.length == 10) mascara = "(00)0000-0000";
      return this.formataCampo(telefone, mascara);
    }
    return telefone;
  }

  formatarData(data: Date): string {
    const dia = this.padZero(data.getDate());
    const mes = this.padZero(data.getMonth() + 1); // Mês é zero-indexado
    const ano = data.getFullYear().toString();

    return `${dia}/${mes}/${ano}`;
  }

  private padZero(numero: number): string {
    return numero < 10 ? "0" + numero : numero.toString();
  }

  replace(valor: string, atual: string, substituicao: string) {
    while (valor.indexOf(atual) > -1) {
      valor = valor.replace(atual, substituicao);
    }
    return valor;
  }

  formataCampo(valor: string, Mascara: string) {
    let boleanoMascara;
    let exp = /\-|\.|\/|\(|\)| /g;
    let campoSoNumeros = valor.replace(exp, "");

    let posicaoCampo = 0;
    let NovoValorCampo = "";
    let TamanhoMascara = campoSoNumeros.length;

    for (let i = 0; i <= TamanhoMascara; i++) {
      boleanoMascara =
        Mascara.charAt(i) == "-" ||
        Mascara.charAt(i) == "." ||
        Mascara.charAt(i) == "/";
      boleanoMascara =
        boleanoMascara ||
        Mascara.charAt(i) == "(" ||
        Mascara.charAt(i) == ")" ||
        Mascara.charAt(i) == " ";
      if (boleanoMascara) {
        NovoValorCampo += Mascara.charAt(i);
        TamanhoMascara++;
      } else {
        NovoValorCampo += campoSoNumeros.charAt(posicaoCampo);
        posicaoCampo++;
      }
    }
    return NovoValorCampo;
  }

  async internetConectada() {
    const status = await Network.getStatus();
    return status.connected;
  }

  async confirmacao(
    msg: string,
    titulo: string,
    funcaoSim: any,
    funcaoNao: any = null,
  ) {
    let confirm = await this.alertCtrl.create({
      header: titulo,
      message: msg,
      buttons: [
        {
          text: "Não",
          handler: () => {
            if (funcaoNao != null) funcaoNao();
          },
        },
        {
          text: "Sim",
          handler: () => {
            funcaoSim();
            // confirm.dismiss();
          },
        },
      ],
    });
    await confirm.present();
    return confirm;
  }

  async mostrarCarregando(texto: string) : Promise<HTMLIonLoadingElement> {
    let loading = await this.loadingCtrl.create({
      message: texto,
      // dismissOnPageChange: true,
    });
    loading.present();
    return loading;
  }

  esconderCarregando(loading: HTMLIonLoadingElement) {
    loading.dismiss();
  }

  async alerta(titulo: string, texto: string, okCallBack: any = null) {
    let alert = await this.alertCtrl.create({
      header: titulo,
      subHeader: texto,
      buttons: [
        {
          text: "OK",
          handler: okCallBack,
        },
      ],
    });
    await alert.present();
  }

  async alertaBasico(
    mensagem: string,
    tempo: number = 2000,
    posicao: string = "center",
  ) {
    let toast = await this.toastCtrl.create({
      message: mensagem,
      duration: tempo,
      // position: posicao,
    });
    await toast.present();
    return toast;
  }

  //formata para exibição da data e hora
  //recebe um date
  formatarDataHora(data: Date) {
    if (data != null) {
      let dia = this.padLeft(data.getDate(), "0", 2);
      let mes = this.padLeft(data.getMonth() + 1, "0", 2);
      let ano = this.padLeft(data.getFullYear(), "0", 2);
      let hora = this.padLeft(data.getHours(), "0", 2);
      let minuto = this.padLeft(data.getMinutes(), "0", 2);
      let segundo = this.padLeft(data.getSeconds(), "0", 2);
      return (
        dia + "/" + mes + "/" + ano + " " + hora + ":" + minuto + ":" + segundo
      );
    }
    return "";
  }

  padLeft(valor: number, char: string, qtd: number) {
    if (valor != null) {
      let str = valor.toString();
      let pad = "";
      for (let i = 0; i < qtd; i++) {
        pad += char;
      }
      return pad.substring(0, pad.length - str.length) + str;
    }
    return "";
  }

  public static calcularValorItem(valor: number, fabCodigo: number): number {
    console.log("calcularValorItem =====", valor);
    //calcular descontolet
    let wAcrCond = 0;
    let wAcrTransp = 0;
    let wDesCond = 0;
    let wDesTransp = 0;
    if (
      UtilProvider.objPedido != null &&
      UtilProvider.objPedido.condicaoPagto != null
    ) {
      wAcrCond = UtilProvider.objPedido.condicaoPagto.acrescimo;
      wDesCond = UtilProvider.objPedido.condicaoPagto.desconto;
      console.log("wAcrCond--", wAcrCond, "wDesCond--", wDesCond);
    }
    if (
      UtilProvider.objPedido != null &&
      UtilProvider.objPedido.transportadora != null
    ) {
      wDesTransp = UtilProvider.objPedido.transportadora.perDesc;
      wAcrTransp = UtilProvider.objPedido.transportadora.perAcres;
      console.log("wDesTransp--", wDesTransp, "wAcrTransp--", wAcrTransp);
    }
    let wPerAcrGeral = wAcrCond + wAcrTransp;
    let wPerDesGeral = wDesCond + wDesTransp;
    console.log("wPerAcrGeral--", wPerAcrGeral, "wPerDesGeral--", wPerDesGeral);
    if (wPerDesGeral > wPerAcrGeral) {
      wPerDesGeral = wPerDesGeral - wPerAcrGeral;
      wPerAcrGeral = 0;
    } else {
      wPerAcrGeral = wPerAcrGeral - wPerDesGeral;
      wPerDesGeral = 0;
    }
    valor += (valor * wPerAcrGeral) / 100;
    valor -= (valor * wPerDesGeral) / 100;
    //dar desconto somente para vendas que forem pra fora
    if (
      UtilProvider.objPedido != null &&
      UtilProvider.objPedido.cliente != null &&
      UtilProvider.objPedido.cliente.estado != "SP" &&
      fabCodigo == 334
    ) {
      // valor -= (valor * 0.08);
      //console.log('por', (UtilProvider.configuracao.descInterestadual / 100));
      console.log('UtilProvider.configuracao', UtilProvider.configuracao);
      valor -= valor * (UtilProvider.configuracao.descInterestadual / 100);
    }
    return this.round(valor);
  }

  validarQuantidade(qtdDigitada: string, qtdMax: number, estado: string) {
    let retorno = 0;
    //console.log('min', UtilProvider.configuracao.embalagemMin);
    //console.log('min', UtilProvider.configuracao.embalagemMin);
    if (UtilProvider.configuracao.embalagemMin == "S" && estado != "SP") {
      if (qtdMax == 0) {
        qtdMax = 1;
      }
      retorno = qtdMax;
      let qtd = 0;
      if (qtdDigitada != "" && (qtd = Number(qtdDigitada)) > 0) {
        if (qtd % qtdMax != 0) {
          retorno = Math.ceil(qtd / qtdMax) * qtdMax;
        } else {
          retorno = qtd;
        }
      }
    } else {
      if (qtdDigitada == "" || qtdDigitada == "0") {
        qtdDigitada = "1";
      }
      retorno = Number(qtdDigitada);
    }
    return retorno;
  }

  public static calcularSt(
    wTotItem: number,
    wFor: number,
    wTrib: string,
    wIpi: number,
    iva: IIva,
    codCest: string,
  ): IValor {
    let wBasSub: number = 0;
    let wCalc: number = 0;
    let wCalc2: number = 0;
    let wCalc3: number = 0;
    let wValSub: number = 0;
    let wValIpi: number = 0;
    let wEstado: string = "";
    let wCliFJ: string = "S";
    //calcular ipi
    if (wFor == 334 && wTrib[0] == "1") {
      wValIpi += this.round((wTotItem * wIpi) / 100);
    }
    if (UtilProvider.objPedido == null || iva == null || codCest.length < 7)
      return { valorIpi: wValIpi, valorSt: 0, baseSt: 0 };
    wEstado = UtilProvider.objPedido.cliente!.estado;
    wCliFJ =
      UtilProvider.objPedido.cliente!.tipoPessoa == "J" &&
      UtilProvider.objPedido.cliente!.ie == "ISENTO"
        ? "S"
        : "N";
    if (wEstado == "SP") {
      if (wFor == 334 && wTrib == "110" && wCliFJ == "N") {
        // IMPORTAÇÃO - CALCULA APENAS O IPI + ST
        wBasSub = wTotItem + wValIpi;
        wBasSub += this.round((wBasSub * iva.perIva) / 100);
        wCalc += this.round((wBasSub * iva.aliqInterna) / 100);
        wCalc2 += wTotItem;
        wCalc2 = this.round((wCalc2 * iva.aliqExterna) / 100);
        wValSub = this.round(wCalc - wCalc2);
      }
    } else if (wEstado != "SP" && wEstado != "MT") {
      //  CALCULO PARA VENDA A ESTADO COM CONVENIO COM "SP"
      if (wFor == 334 && wTrib == "110" && wCliFJ == "N") {
        wBasSub = wTotItem + wValIpi;
        if (wTrib[0] == "1" || wTrib[0] == "2")
          wBasSub += this.round((wBasSub * iva.perIvaImp) / 100);
        else wBasSub += this.round((wBasSub * iva.perIva) / 100);
        wCalc = this.round((wTotItem * 4) / 100); // Aliquota Interna do Produto
        wCalc2 = this.round((wBasSub * iva.aliqInterna) / 100); // Aliquota de ICMS do Estado Destino, precisa criar uma variável para pegar de acordo com o Estado
        wValSub = wCalc2 - wCalc;
      } else if (wTrib != "110" && wCliFJ == "N") {
        wBasSub = wTotItem;
        if (wTrib[0] == "1" || wTrib[0] == "2")
          wBasSub += this.round((wBasSub * iva.perIvaImp) / 100);
        else wBasSub += this.round((wBasSub * iva.perIva) / 100);
        wCalc = this.round((wBasSub * iva.aliqInterna) / 100); // Aliquota Interna do Produto
        wCalc2 = wTotItem;
        if (wTrib[0] == "1" || wTrib[0] == "2")
          wCalc2 = this.round((wCalc2 * iva.aliqExtImp) / 100); // AAliquota de ICMS do Estado Destino, precisa criar uma variável para pegar de acordo com o Estado
        else wCalc2 = this.round((wCalc2 * iva.aliqExterna) / 100); // AAliquota de ICMS do Estado Destino, precisa criar uma variável para pegar de acordo com o Estado
        wValSub = wCalc - wCalc2;
      }
    }
    else if (wEstado == "MT") {
      let totalWithIPI = wTotItem + wValIpi
      console.log("ENTROU NESTA REGRA" + totalWithIPI)
      wCalc = totalWithIPI + (totalWithIPI * iva.perIva / 100);
      wCalc2 = wCalc * iva.aliqInterna / 100;
      console.log("IPI" + wCalc2)
      wCalc3 = wTotItem * iva.aliqExterna /100;
      wValSub = wCalc2 - wCalc3;

    }
    // else if (wEstado == "MT") {
    //   wCalc = this.round((wTotItem * iva.aliqInterna) / 100);
    //   if (wTrib[0] == "1" || wTrib[0] == "2")
    //     wCalc2 = this.round((wTotItem * iva.aliqExtImp) / 100);
    //   else wCalc2 = this.round((wTotItem * iva.aliqExterna) / 100);
    //   wBasSub = this.round(iva.aliqInterna / 100);
    //   wBasSub = this.round(wCalc + wCalc2 / wBasSub);
    //   wValSub = this.round((wTotItem * iva.perIvaOrig) / 100);
    // }
    return <IValor>{ valorIpi: wValIpi, valorSt: wValSub, baseSt: wBasSub };
  }

  calcularTotalPedido(lstPedidosItens: IPedidosItens[]): number {
    let total = 0;
    lstPedidosItens.forEach((cada) => {
      total += cada.total;
    });
    return total;
  }

  public static recalcularValorItem(
    ivaProvider: IvaProvider,
    pedidosItensProvider: PedidosItensProvider,
  ) {
    return new Promise((resolve) => {
      if (
        UtilProvider.objPedido.pedidosItens != null &&
        UtilProvider.objPedido.pedidosItens.length > 0
      ) {
        let i: number = 0;
        let vlrTotal: number = 0;
        UtilProvider.objPedido.pedidosItens.forEach((x: IPedidosItens) => {
          x.valorUnitario = UtilProvider.calcularValorItem(
            x.valor - UtilProvider.round((x.valor * x.desconto) / 100),
            x.item!.fabCodigo,
          );
          ivaProvider.buscar(x.item!.claFiscal).subscribe((iva) => {
            let retorno = UtilProvider.calcularSt(
              x.valorUnitario * x.quantidade,
              x.item!.fabCodigo,
              x.item!.codTributacao,
              x.item!.ipi,
              iva,
              x.item!.codCest,
            );
            x.valorIpi = retorno.valorIpi;
            x.valorSt = retorno.valorSt;
            x.total =
              x.valorUnitario * x.quantidade +
              retorno.valorIpi +
              retorno.valorSt;
            vlrTotal += x.total;
            pedidosItensProvider.salvar(x).subscribe(() => {
              i++;
              if (i == UtilProvider.objPedido.pedidosItens.length) {
                UtilProvider.objPedido.valor = vlrTotal;
                resolve(0);
              }
            });
          });
        });
      } else {
        resolve(0);
      }
    });
  }

  public static obterCodigoBanco(banco: string) {
    let codigo = 0;
    switch (banco) {
      case "EroPed":
        codigo = 1;
        break;
      case "StaPed":
        codigo = 2;
        break;
      case "SonPed":
        codigo = 3;
        break;
    }
    return codigo;
  }

  public static obterBancoPorCodigo(codigo: number) {
    let banco = "";
    switch (codigo) {
      case 1:
        banco = "EroPed";
        break;
      case 2:
        banco = "StaPed";
        break;
      case 3:
        banco = "SonPed";
        break;
    }
    return banco;
  }

  //deixa no formato que o sqlite suporta
  static formatarDataSql(data: Date) {
    if (data != null) {
      // data = new Date(data);
      let mes = (data.getMonth() + 1).toString();
      let dia = data.getDate().toString();
      let segundo = data.getSeconds().toString();
      if (mes.length == 1) mes = "0" + mes;
      if (dia.length == 1) dia = "0" + dia;
      if (segundo.length == 1) segundo = "0" + segundo;
      return (
        data.getFullYear() +
        "-" +
        mes +
        "-" +
        dia +
        " " +
        data.getHours() +
        ":" +
        data.getMinutes() +
        ":" +
        segundo
      );
    }
    return null;
  }

  //recebe uma data em string, no formato que o sqlite comporta
  //retorna um Date
  static converterData(data: string): Date {
    let dtRetorno: Date = new Date();
    if (data != null && data != "") {
      let dataHora = data.toString().split(" "); //0 = data, 1 = hora
      let anoMesDia = dataHora[0].split("-");
      let hora = dataHora[1].split(":");
      if (anoMesDia[0] == "NaN") {
        return new Date();
      } else {
        //mes começa sempre do 0, ou seja, janeiro é 0 e não 1
        dtRetorno = new Date(
          parseInt(anoMesDia[0]),
          parseInt(anoMesDia[1]) - 1,
          parseInt(anoMesDia[2]),
          parseInt(hora[0]),
          parseInt(hora[1]),
          parseInt(hora[2]),
        );
      }
    }
    return dtRetorno;
  }

  static completarObservable(subs: Subscriber<any>, retorno: any) {
    subs.next(retorno);
    subs.complete();
  }

  async obterVersao() {
    const info = await App.getInfo();
    console.log('Versão do App:', info);
    const versionNumber = info.version;
    UtilProvider.versao = versionNumber;
    console.log('Versão do App:', versionNumber);
    return versionNumber;
  }
}

export let Md5 = (valor: string) => {
  function RotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function AddUnsigned(lX: number, lY: number) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }

  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }

  function H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }

  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function ConvertToWordArray(valor: string) {
    var lWordCount;
    var lMessageLength = valor.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 =
      (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] =
        lWordArray[lWordCount] |
        (valor.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function WordToHex(lValue: number) {
    var WordToHexValue = "",
      WordToHexValue_temp = "",
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue =
        WordToHexValue +
        WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }

  function Utf8Encode(valor: string) {
    valor = valor.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < valor.length; n++) {
      var c = valor.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  }

  var x = Array();
  var k, AA, BB, CC, DD, a, b, c, d;
  var S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  var S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  var S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  var S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  valor = Utf8Encode(valor);

  x = ConvertToWordArray(valor);

  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }

  var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

  return temp.toLowerCase();
};
