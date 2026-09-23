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
import { AppointmentResponse } from '../../appointments.service';
import { Button } from '@shared/button/button';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { Skeleton } from '@shared/skeleton/skeleton';
import { ToastService } from '@shared/toast/toast.service';
import { canConvertWaitlistEntry } from '../waitlist-status';
import { WaitlistConvertDialog } from '../waitlist-convert-dialog/waitlist-convert-dialog';
import { WaitlistEntryResponse } from '../waitlist.service';

@Component({
  selector: 'app-waitlist-recovery-panel',
  imports: [Button, Skeleton, WaitlistConvertDialog],
  templateUrl: './waitlist-recovery-panel.html',
  host: { class: 'block' },
})
export class WaitlistRecoveryPanel {
  readonly candidates = input<WaitlistEntryResponse[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly sourceAppointmentId = input<string | null>(null);
  readonly sourceStartsAt = input<string | undefined>(undefined);
  readonly sourceEndsAt = input<string | undefined>(undefined);
  readonly retry = output<void>();
  readonly closed = output<void>();
  readonly converted = output<AppointmentResponse>();

  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly conversionTemplate =
    viewChild.required<TemplateRef<unknown>>('conversionTemplate');
  private conversionDialog: ModalHandle | null = null;
  readonly selectedCandidate = signal<WaitlistEntryResponse | null>(null);
  private readonly hiddenCandidateIds = signal<ReadonlySet<string>>(new Set());

  readonly visibleCandidates = computed(() => {
    const hidden = this.hiddenCandidateIds();
    return this.candidates().filter((candidate) => !candidate.id || !hidden.has(candidate.id));
  });
  readonly hasCandidates = computed(() => this.visibleCandidates().length > 0);

  candidateName(candidate: WaitlistEntryResponse): string {
    return candidate.patientName || 'Paciente sin nombre';
  }

  candidatePhone(candidate: WaitlistEntryResponse): string {
    return candidate.patientPhone || 'Sin teléfono';
  }

  candidateRange(candidate: WaitlistEntryResponse): string {
    const from = candidate.desiredFrom;
    const to = candidate.desiredTo;
    if (from && to) {
      return `${this.format(from)} – ${this.format(to)}`;
    }
    if (from) {
      return `Desde ${this.format(from)}`;
    }
    if (to) {
      return `Hasta ${this.format(to)}`;
    }
    return 'Cualquier horario';
  }

  canConvert(candidate: WaitlistEntryResponse): boolean {
    return Boolean(
      candidate.id && this.sourceAppointmentId() && canConvertWaitlistEntry(candidate),
    );
  }

  openConversion(candidate: WaitlistEntryResponse): void {
    if (!this.canConvert(candidate)) {
      return;
    }
    this.selectedCandidate.set(candidate);
    this.conversionDialog = this.modals.open(this.conversionTemplate(), {
      title: 'Convertir candidato',
    });
  }

  onConverted(appointment: AppointmentResponse): void {
    const candidate = this.selectedCandidate();
    if (candidate?.id) {
      this.hiddenCandidateIds.update((hidden) => new Set(hidden).add(candidate.id!));
    }
    this.closeConversion();
    this.converted.emit(appointment);
    this.toasts.success('Cita creada desde la lista de espera.');
  }

  onConversionCancelled(): void {
    this.closeConversion();
  }

  close(): void {
    this.closeConversion();
    this.closed.emit();
  }

  private closeConversion(): void {
    this.conversionDialog?.close();
    this.conversionDialog = null;
    this.selectedCandidate.set(null);
  }

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });

  private format(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : this.dateTimeFormatter.format(date);
  }
}
