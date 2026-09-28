import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@core/api/api-client';
import { NOTIFICATION_PAGE_SIZE, PageNotificationResponse } from './notification-models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the recent attempts window, newest first.
  // Large enough for a debugging snapshot; the page says so honestly
  // when the backend holds more attempts than this window.
  recent(): HttpResourceRef<PageNotificationResponse | undefined> {
    return httpResource<PageNotificationResponse>(() => ({
      url: this.api.url('/api/v1/notifications'),
      params: { size: String(NOTIFICATION_PAGE_SIZE), sort: 'createdAt,desc' },
    }));
  }
}
