import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { TextInput } from '@shared/text-input/text-input';
import { ToastService } from '@shared/toast/toast.service';
import { canContactWaitlistEntry, canDiscardWaitlistEntry } from '../waitlist-status';
import {
  UpdateWaitlistStatusRequest,
  WaitlistEntryResponse,
  WaitlistService,
} from '../waitlist.service';

type StatusAction = 'contactado' | 'descartada';

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.error === 'string') {
      return body.error;
    }
  }
  return 'No pudimos actualizar la entrada. Intenta de nuevo.';
}

@Component({
  selector: 'app-waitlist-row-actions',
  imports: [Button, CdkMenu, CdkMenuItem, CdkMenuTrigger, FormField, Icon, TextInput],
  templateUrl: './waitlist-row-actions.html',
  host: { class: 'block' },
})
export class WaitlistRowActions {
  readonly entry = input.required<WaitlistEntryResponse>();
  readonly updated = output<WaitlistEntryResponse>();

  private readonly waitlist = inject(WaitlistService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly statusTemplate = viewChild.required<TemplateRef<unknown>>('statusTemplate');
  private dialog: ModalHandle | null = null;

  readonly action = signal<StatusAction | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly reasonModel = signal({ discardReason: '' });
  readonly statusForm = form(this.reasonModel);
  readonly canContact = computed(() => canContactWaitlistEntry(this.entry()));
  readonly canDiscard = computed(() => canDiscardWaitlistEntry(this.entry()));
  readonly hasActions = computed(() => this.canContact() || this.canDiscard());

  openContact(): void {
    if (!this.canContact() || this.pending()) {
      return;
    }
    this.open('contactado');
  }

  openDiscard(): void {
    if (!this.canDiscard() || this.pending()) {
      return;
    }
    this.open('descartada');
  }

  confirm(): void {
    const action = this.action();
    const id = this.entry().id;
    if (!action || !id || this.pending()) {
      return;
    }
    submit(this.statusForm, () => this.save(id, action));
  }

  cancel(): void {
    if (!this.pending()) {
      this.close();
    }
  }

  private open(action: StatusAction): void {
    this.action.set(action);
    this.error.set(null);
    this.reasonModel.set({ discardReason: '' });
    this.dialog = this.modals.open(this.statusTemplate(), {
      title: action === 'contactado' ? 'Marcar como contactado' : 'Descartar entrada',
    });
  }

  private async save(id: string, action: StatusAction): Promise<void> {
    this.pending.set(true);
    this.error.set(null);
    const body: UpdateWaitlistStatusRequest = {
      status: action,
      ...(action === 'descartada' && this.reasonModel().discardReason.trim()
        ? { discardReason: this.reasonModel().discardReason.trim() }
        : {}),
    };
    try {
      const updated = await firstValueFrom(this.waitlist.updateStatus(id, body));
      this.updated.emit(updated);
      this.close();
      this.toasts.success(
        action === 'contactado' ? 'Entrada marcada como contactada.' : 'Entrada descartada.',
      );
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }

  private close(): void {
    this.dialog?.close();
    this.dialog = null;
    this.action.set(null);
  }
}
