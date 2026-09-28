import { Component, computed, input, output } from '@angular/core';
import { Button } from '@shared/button/button';
import {
  NotificationResponse,
  instantLabel,
  notificationChannelLabel,
  notificationStatusLabel,
} from '../notification-models';

// Read-only attempt detail. Failed attempts always show their error
// detail: debugging a delivery must never require backend log access.
@Component({
  selector: 'app-notification-detail',
  imports: [Button],
  templateUrl: './notification-detail.html',
  host: { class: 'block' },
})
export class NotificationDetail {
  readonly notification = input.required<NotificationResponse>();
  readonly closed = output<void>();

  readonly sentLabel = computed(() => instantLabel(this.notification().sentAt));

  statusLabel(): string {
    return notificationStatusLabel(this.notification().status);
  }

  channelLabel(): string {
    return notificationChannelLabel(this.notification().channel);
  }

  createdLabel(): string {
    return instantLabel(this.notification().createdAt);
  }

  close(): void {
    this.closed.emit();
  }
}
