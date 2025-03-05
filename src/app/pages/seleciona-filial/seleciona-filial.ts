import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
import { IFilial } from "@interfaces/filiais.interface";
import { ModalController } from "@ionic/angular";
import { FiliaisProvider } from "@services/filiais-provider";
import { FuncionariosProvider } from "@services/funcionarios-provider";


@Component({
  selector: "seleciona-filial",
  templateUrl: "seleciona-filial.html",
  styleUrls: ["seleciona-filial.scss"],
  standalone: false,
})
export class SelecionaFilialComponent {
  filiais: string[] = [];
  @Input() funcionario: string;
  filiaisCod: number[];
  filialCod: number[];

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private filialProv: FiliaisProvider,
    private updateFuncionario: FuncionariosProvider,
  ) {}

  async ionViewDidEnter() {
    //obter parâmetros passados, considerando que este componente foi chamado por um modal
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { funcionario: string };
    this.funcionario = componentProps?.funcionario;
    console.log("FUNCIONARIO -> " + this.funcionario);
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
    let codigo = filialParts[1];
    console.log("NAME FILIAL -> " + name);
    localStorage.setItem("codFilialSet", codigo);
    this.updateFuncionario.atualizaFilialCod(parseInt(codigo));
    this.fechar(codigo);
  }

  fechar(data?: any) {
    return this.modalCtrl.dismiss(data);
  }
}
