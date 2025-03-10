import { ModalController, Platform } from '@ionic/angular';
import { Component, OnInit, ViewChild } from "@angular/core";
import { IFotos } from "../../interfaces/fotos.interface";
import { IFilial } from "../../interfaces/filiais.interface";
// import { ImageViewerController } from 'ionic-img-viewer';
import { IItens } from "@interfaces/itens.interface";
import { Router } from '@angular/router';
import { FotosProvider } from "@services/fotos-provider";
import { FiliaisProvider } from "@services/filiais-provider";
import { UtilProvider } from "@services/util-provider";
import { IEstoque } from "@interfaces/estoque.interface";
import { AbstractModalComponent } from "src/app/components/modal/abstract-modal.component";

@Component({
  selector: "app-produto-detalhe",
  templateUrl: "produto-detalhe.html",
  styleUrls: ["produto-detalhe.scss"],
  standalone: false,
})
export class ProdutoDetalhePage extends AbstractModalComponent {
  // _imageViewerCtrl: ImageViewerController;
  _item: IItens = null;
  _fotos: IFotos = null;
  _estoque: IEstoque[] = [];

  _exibeImg1 = true;
  _exibeImg2 = true;
  _exibeImg3 = true;
  _exibeImg4 = true;

  _filial: IFilial[] = [];

  constructor(
    // imageViewerCtrl: ImageViewerController,
    private fotosProvider: FotosProvider,
    public filialProv: FiliaisProvider,
    public util: UtilProvider,
    modalCtrl: ModalController,
    platform: Platform
  ) {
    super(modalCtrl, platform);
  }

  async ionViewDidEnter() {
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { item: IItens };
    this._item = componentProps?.item;

    // this._imageViewerCtrl = imageViewerCtrl;

    this.fotosProvider.buscar(this._item.codigo).subscribe((fotos) => {
      //console.log('fotos', fotos);
      if (fotos == null && this.util.internetConectada()) {
        this.fotosProvider.sincronizar(this._item.codigo).subscribe((fotos) => {
          if (fotos != null) {
            this._fotos = fotos;
          }
        });
      } else {
        this._fotos = fotos;
      }
    });

    // itensProvider.getEstoque().subscribe((est) => {
    //   this._estoque = est;
    //   console.log("estoque do getEstoque" + JSON.stringify(this._estoque));
    // });

    this.filialProv.buscarT().subscribe((fil) => {
      console.log("buscando nome filial - ", fil);
      this._filial = fil;
    });
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad ProdutoDetalhePage');
    // this._slides.loop = true;
  }

  abrirImagem(img: any) {
    // const imageViewer = this._imageViewerCtrl.create(img);
    // imageViewer.present();

    // setTimeout(() => imageViewer.dismiss(), 1000);
    // imageViewer.onDidDismiss(() => alert('Viewer dismissed'));
  }

  // calcularValorItem(item: IItens) {
  //   if(item != null) {
  //     console.log('valorUnitario', item.valorUnitario);
  //     console.log('valor', item.valor);
  //     console.log('iValor', JSON.stringify(item.iValor));
  //     let valor = item.valorUnitario;
  //     if(item.iValor != null && item.qtd > 0) {
  //       valor += (item.iValor.valorIpi / item.qtd) + (item.iValor.valorSt / item.qtd);
  //     }
  //     return this.util.formatarMoeda(valor);
  //   }
  // }

  onError(nImg: number) {
    if (nImg == 1) {
      this._exibeImg1 = false;
      console.log("Img1: ", this._exibeImg1);
    }
    if (nImg == 2) {
      this._exibeImg2 = false;
      console.log("Img2: ", this._exibeImg2);
    }
    if (nImg == 3) {
      this._exibeImg3 = false;
      console.log("Img3: ", this._exibeImg3);
    }
    if (nImg == 4) {
      this._exibeImg4 = false;
      console.log("Img4: ", this._exibeImg4);
    }
  }

  calcularIpi(item: IItens) {
    if (item != null) {
      return item.valor + (item.valor * item.ipi) / 100;
    }
    return 0;
  }

  retNomeFilial(numFilial: number) {
    //console.log('exibe filiais: ', this._filial);
    return this._filial.find((x) => x.codigo == numFilial).nomeFantasia;
  }
}
