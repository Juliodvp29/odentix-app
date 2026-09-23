import { Component, computed, input, output } from '@angular/core';
import { Button } from '@shared/button/button';
import { Skeleton } from '@shared/skeleton/skeleton';
import { WaitlistEntryResponse } from '../waitlist.service';

@Component({
  selector: 'app-waitlist-recovery-panel',
  imports: [Button, Skeleton],
  templateUrl: './waitlist-recovery-panel.html',
  host: { class: 'block' },
})
export class WaitlistRecoveryPanel {
  readonly candidates = input<WaitlistEntryResponse[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();
  readonly closed = output<void>();

  readonly hasCandidates = computed(() => this.candidates().length > 0);

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });

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
      return `${this.dateTimeFormatter.format(new Date(from))} – ${this.dateTimeFormatter.format(new Date(to))}`;
    }
    if (from) {
      return `Desde ${this.dateTimeFormatter.format(new Date(from))}`;
    }
    if (to) {
      return `Hasta ${this.dateTimeFormatter.format(new Date(to))}`;
    }
    return 'Cualquier horario';
  }
}
