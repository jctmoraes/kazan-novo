import { IFabricantes } from "./fabricantes.interface";

export class IItens {
    codigo: number = 0;
    nome: string = '';
    imagem: string = '';
    fabCodigo: number = 0;
    embalagem: string = '';
    valor: number = 0; //valor unitário com imposto
    desconto: number = 0;
    descQtd: number = 0;
    ipi: number = 0; //valor em porcentagem IPI
    claFiscal: number = 0;
    codTributacao: string = '';
    codCest: string = '';
    codBarras: string = '';
    qtdMax: number = 0;
    descLimite: number = 0;
    estoque: number = 0;
    qtd: number | null = null;
    fabricante: IFabricantes | null = null;
    valorUnitario: number | null = null; //valor unitário sem impostos
    valorTotal: number | null = null; //valor com impostos * quantidade
    iValor: IValor | null = null;
}

export interface IValor {
    valorIpi: number;
    valorSt: number;
    baseSt: number;
}
