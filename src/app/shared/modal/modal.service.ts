import { Injectable, TemplateRef, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { Observable, filter } from 'rxjs';
import { ModalData, ModalDialog } from './modal-dialog';

export interface ModalOptions {
  title: string;
}

export interface ModalHandle {
  close: () => void;
  readonly closed: Observable<unknown>;
}

// Matches --duration-base: keep in sync if the token changes.
const EXIT_ANIMATION_MS = 200;

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(Dialog);
  private readonly scrollStrategies = inject(ScrollStrategyOptions);
  private readonly exiting = new WeakSet<DialogRef<unknown, ModalDialog>>();

  open(template: TemplateRef<unknown>, options: ModalOptions): ModalHandle {
    const ref = this.dialog.open<unknown, ModalData, ModalDialog>(ModalDialog, {
      data: { title: options.title, template },
      ariaLabel: options.title,
      disableClose: true,
      panelClass: 'modal-pane',
      scrollStrategy: this.scrollStrategies.block(),
    });
    ref.backdropClick.subscribe(() => this.dismiss(ref));
    ref.keydownEvents
      .pipe(filter((event) => event.key === 'Escape'))
      .subscribe(() => this.dismiss(ref));
    ref.componentInstance?.dismiss.subscribe(() => this.dismiss(ref));
    return {
      close: () => this.dismiss(ref),
      closed: ref.closed,
    };
  }

  private dismiss(ref: DialogRef<unknown, ModalDialog>): void {
    if (this.exiting.has(ref)) {
      return;
    }
    this.exiting.add(ref);
    ref.componentInstance?.startExit();
    setTimeout(() => ref.close(), EXIT_ANIMATION_MS);
  }
}
