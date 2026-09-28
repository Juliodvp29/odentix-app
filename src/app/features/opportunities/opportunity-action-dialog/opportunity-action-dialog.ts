import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Button } from '@shared/button/button';
import {
  OpportunityActionResponse,
  OpportunityResponse,
  actionTypeLabel,
  opportunityTitle,
} from '../opportunity-models';
import { OpportunitiesService } from '../opportunities.service';

function notificationChannelLabelFallback(channel: string | null | undefined): string {
  if (!channel) {
    return 'el canal registrado';
  }
  if (channel === 'whatsapp') {
    return 'WhatsApp';
  }
  if (channel === 'email') {
    return 'correo';
  }
  return channel;
}

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
  return 'No pudimos ejecutar la acción. Intenta de nuevo.';
}

// Review-then-confirm for a suggested action. The backend executes the
// frozen suggestion (no edit payload exists), so this dialog reviews
// exactly what will happen and requires an explicit confirmation:
// nothing here ever auto-sends.
@Component({
  selector: 'app-opportunity-action-dialog',
  imports: [Button],
  templateUrl: './opportunity-action-dialog.html',
  host: { class: 'block' },
})
export class OpportunityActionDialog {
  readonly opportunity = input.required<OpportunityResponse>();
  readonly executed = output<{
    opportunity: OpportunityResponse;
    action: OpportunityActionResponse;
  }>();
  readonly cancelled = output<void>();

  private readonly opportunities = inject(OpportunitiesService);

  readonly executing = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly action = computed(() => this.opportunity().actions?.[0] ?? null);
  readonly title = computed(() => opportunityTitle(this.opportunity()));
  readonly typeLabel = computed(() => actionTypeLabel(this.action()?.actionType));
  readonly message = computed(() => this.action()?.suggestedMessage ?? '');
  readonly isMessageAction = computed(() => this.action()?.actionType === 'enviar_mensaje');
  readonly channelHint = computed(() =>
    this.isMessageAction()
      ? `Se enviará por ${notificationChannelLabelFallback(this.action()?.channel)} al contacto registrado hoy.`
      : 'Se creará como tarea pendiente del equipo.',
  );

  confirm(): void {
    if (this.executing()) {
      return;
    }
    void this.execute();
  }

  cancel(): void {
    if (!this.executing()) {
      this.cancelled.emit();
    }
  }

  private async execute(): Promise<void> {
    const opportunityId = this.opportunity().id;
    const actionId = this.action()?.id;
    if (!opportunityId || !actionId) {
      return;
    }
    this.serverError.set(null);
    this.executing.set(true);
    try {
      const action = await firstValueFrom(
        this.opportunities.executeAction(opportunityId, actionId),
      );
      this.executed.emit({ opportunity: this.opportunity(), action });
    } catch (error) {
      this.serverError.set(errorMessage(error));
    } finally {
      this.executing.set(false);
    }
  }
}
