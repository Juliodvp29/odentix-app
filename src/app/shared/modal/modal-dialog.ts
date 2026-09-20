import { Component, computed, inject, output, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';

export interface ModalData {
  title: string;
  template: TemplateRef<unknown>;
}

@Component({
  selector: 'app-modal-dialog',
  imports: [Icon, IconButton, NgTemplateOutlet],
  template: `
    <div [class]="panelClasses()">
      <div class="mb-16 flex items-center justify-between gap-16">
        <h2 class="text-heading-sm text-ink">{{ data.title }}</h2>
        <app-icon-button label="Close dialog" (clicked)="dismiss.emit()">
          <app-icon name="x" />
        </app-icon-button>
      </div>
      <ng-container *ngTemplateOutlet="data.template" />
    </div>
  `,
})
export class ModalDialog {
  readonly data = inject<ModalData>(DIALOG_DATA);
  readonly dismiss = output<void>();

  private readonly exitStarted = signal(false);

  readonly panelClasses = computed(
    () =>
      'rounded-modal bg-paper p-24 shadow-overlay ' +
      (this.exitStarted() ? 'modal-panel-exit' : 'modal-panel-enter'),
  );

  startExit(): void {
    this.exitStarted.set(true);
  }
}
