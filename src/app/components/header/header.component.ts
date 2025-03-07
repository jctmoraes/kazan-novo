import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: false,
})
export class HeaderComponent {
  @Input() title: string;
  @Output() backButtonClick = new EventEmitter<void>();

  onBackButtonClick() {
    this.backButtonClick.emit();
  }
}
