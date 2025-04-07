import { Injectable } from "@angular/core";

@Injectable()
export class FilialSelecionadaService {
  private _filialSelecionada: number = 0;

  setFilialSelecionada(filial: number) {
    localStorage.setItem("codFilialSet", filial.toString());
    this._filialSelecionada = filial;
  }

  setFilialSelecionadaSeNaoExistir(filial: number) {
    if (!this.getFilialSelecionada() && filial) {
      this.setFilialSelecionada(filial);
    }
  }

  getFilialSelecionada(): number {
    if (this._filialSelecionada) {
      return this._filialSelecionada;
    }
    const filial = localStorage.getItem("codFilialSet");
    console.log("FILIAL -> " + filial);
    if (filial !== undefined && filial !== null) {
      this._filialSelecionada = parseInt(filial);
    }
    return this._filialSelecionada;
  }
}
