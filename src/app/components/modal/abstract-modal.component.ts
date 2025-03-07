import { ModalController, Platform } from '@ionic/angular';
import { Directive } from '@angular/core';

@Directive()
export abstract class AbstractModalComponent {
  constructor(public modalCtrl: ModalController, private platform: Platform) {
    this.platform.backButton.subscribeWithPriority(10, () => {
      this.fechar();
    });
  }

  fechar(data?: any) {
    this.modalCtrl.dismiss(data);
  }
}
