import { Component, TemplateRef, computed, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { SpecialistResponse, specialistInitials } from '../specialist-models';
import { SettlementsService, isPlanGateError } from '../settlements.service';
import { SpecialistCreateForm } from '../specialist-create-form/specialist-create-form';

@Component({
  selector: 'app-specialists-list',
  imports: [Button, Icon, RouterLink, Skeleton, SpecialistCreateForm],
  templateUrl: './specialists-list.html',
  host: { class: 'block space-y-24' },
})
export class SpecialistsList {
  private readonly settlements = inject(SettlementsService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private createDialog: ModalHandle | null = null;
  private readonly resource = this.settlements.specialists();

  readonly specialists = computed<SpecialistResponse[]>(() => this.resource.value() ?? []);
  readonly loading = computed(() => this.resource.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.resource.error()));
  readonly loadFailed = computed(
    () => !this.planGated() && this.resource.error() !== undefined,
  );

  initials(name: string | null | undefined): string {
    return specialistInitials(name);
  }

  feeLabel(fee: number | null | undefined): string {
    return `${Number(fee ?? 0)} %`;
  }

  retry(): void {
    this.resource.reload();
  }

  openCreate(): void {
    this.createDialog = this.modals.open(this.createTemplate(), {
      title: 'Nuevo especialista',
    });
  }

  onCreated(): void {
    this.closeCreate();
    this.toasts.success('Especialista creado.');
    this.resource.reload();
  }

  onCreateCancelled(): void {
    this.closeCreate();
  }

  private closeCreate(): void {
    this.createDialog?.close();
    this.createDialog = null;
  }
}
