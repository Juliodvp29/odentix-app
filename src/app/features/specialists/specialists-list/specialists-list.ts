import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Skeleton } from '@shared/skeleton/skeleton';
import { SpecialistResponse, specialistInitials } from '../specialist-models';
import { SettlementsService, isPlanGateError } from '../settlements.service';

@Component({
  selector: 'app-specialists-list',
  imports: [Button, Icon, RouterLink, Skeleton],
  templateUrl: './specialists-list.html',
  host: { class: 'block space-y-24' },
})
export class SpecialistsList {
  private readonly settlements = inject(SettlementsService);
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
}
