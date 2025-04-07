import { FilialSelecionadaService } from './../../services/filial-selecionada.service';
import { Component, Input } from "@angular/core";
import { IFilial } from "@interfaces/filiais.interface";
import { IFuncionarios } from "@interfaces/funcionarios.interface";
import { ModalController } from "@ionic/angular";
import { FiliaisProvider } from "@services/filiais-provider";
import { FuncionariosProvider } from "@services/funcionarios-provider";
import { UtilProvider } from "@services/util-provider";


@Component({
  selector: "seleciona-filial",
  templateUrl: "seleciona-filial.html",
  styleUrls: ["seleciona-filial.scss"],
  standalone: false,
})
export class SelecionaFilialComponent {
  filiais: string[] = [];
  funcionario: IFuncionarios;
  filiaisCod: number[];
  filialCod: number[];

  constructor(
    private modalCtrl: ModalController,
    private filialProv: FiliaisProvider,
    private funcionarioProvider: FuncionariosProvider,
    private filialSelecionadaService: FilialSelecionadaService
  ) {}

  async ionViewDidEnter() {
    //obter parâmetros passados, considerando que este componente foi chamado por um modal
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { funcionario: IFuncionarios };
    this.funcionario = componentProps?.funcionario;
    console.log("funcionario -> " + this.funcionario);
    // const nav = this.navParams.get("funcionario");
    // console.log("NAV -> " + nav);
    if (this.funcionario) {
      this.filialProv.buscarT().subscribe(
        (filiais: IFilial[]) => {
          this.filiais = filiais.map(
            (f) => `${f.nomeFantasia} /COD:${f.codigo}`
          );
        },
        (err) => {
          console.error(err);
          this.filiais = ["Filial"];
        }
      );
    } else {
      this.filiais = ["Filial"];
    }
  }

  async selectFilial(filial: string) {
    let filialParts = filial.split(" /COD:");
    let name = filialParts[0];
    let codigo = parseInt(filialParts[1]);
    console.log("NAME FILIAL -> " + name);
    localStorage.setItem("codFilialSet", filialParts[1]);
    this.funcionarioProvider.atualizaFilialCod(codigo);
    this.filialSelecionadaService.setFilialSelecionada(codigo);
    this.fechar(codigo);
  }

  fechar(data?: any) {
    return this.modalCtrl.dismiss(data);
  }
}
