import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { Button } from '@shared/button/button';
import { Table } from '@shared/table/table';
import { TableColumn, TableQuery, TableRow, createInitialQuery } from '@shared/table/table-models';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { NotificationDetail } from '../notification-detail/notification-detail';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_STATUS_META,
  NotificationResponse,
  instantLabel,
  notificationChannelLabel,
  notificationStatusLabel,
} from '../notification-models';
import { NotificationsService } from '../notifications.service';

@Component({
  selector: 'app-notification-list-page',
  imports: [Button, NotificationDetail, Table],
  templateUrl: './notification-list-page.html',
  host: { class: 'block' },
})
export class NotificationListPage {
  private readonly notifications = inject(NotificationsService);
  private readonly modals = inject(ModalService);
  private readonly detailTemplate = viewChild.required<TemplateRef<unknown>>('detailTemplate');
  private detailDialog: ModalHandle | null = null;

  private readonly resource = this.notifications.recent();

  readonly query = signal<TableQuery>(createInitialQuery(20));

  readonly loading = computed(() => this.resource.isLoading());
  readonly loadError = computed(() => this.resource.error() !== undefined);
  readonly truncated = computed(
    () =>
      (this.resource.value()?.totalElements ?? 0) > (this.resource.value()?.content ?? []).length,
  );
  readonly totalCount = computed(() => this.resource.value()?.totalElements ?? 0);

  private readonly content = computed<NotificationResponse[]>(
    () => this.resource.value()?.content ?? [],
  );

  // The table renders exactly what it receives, so search, filters,
  // sort and pagination over the fetched window live here.
  private readonly filtered = computed<NotificationResponse[]>(() => {
    const active = this.query();
    const search = (active.search ?? '').trim().toLowerCase();
    const statusFilter = active.filters['status'];
    const channelFilter = active.filters['channel'];
    const matches = this.content().filter((attempt) => {
      if (
        typeof statusFilter === 'string' &&
        statusFilter !== '' &&
        attempt.status !== statusFilter
      ) {
        return false;
      }
      if (
        typeof channelFilter === 'string' &&
        channelFilter !== '' &&
        attempt.channel !== channelFilter
      ) {
        return false;
      }
      if (search) {
        const haystack = (
          `${attempt.recipient ?? ''} ${attempt.templateKey ?? ''} ` +
          `${notificationChannelLabel(attempt.channel)} ` +
          `${notificationStatusLabel(attempt.status)}`
        ).toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    });
    if (active.sortKey === 'createdAt') {
      const direction = active.sortDir === 'asc' ? 1 : -1;
      return [...matches].sort((a, b) =>
        (a.createdAt ?? '') < (b.createdAt ?? '') ? -direction : direction,
      );
    }
    return matches;
  });

  readonly rows = computed<TableRow[]>(() => {
    const active = this.query();
    const start = (active.page - 1) * active.pageSize;
    return this.filtered().slice(start, start + active.pageSize);
  });
  readonly total = computed(() => this.filtered().length);

  readonly columns: ReadonlyArray<TableColumn> = [
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      accessor: (row) => instantLabel(this.attempt(row).createdAt),
    },
    {
      key: 'channel',
      header: 'Canal',
      filter: {
        kind: 'select',
        options: NOTIFICATION_CHANNELS.map((channel) => ({
          value: channel,
          label: NOTIFICATION_CHANNEL_LABELS[channel],
        })),
      },
      accessor: (row) => notificationChannelLabel(this.attempt(row).channel),
    },
    {
      key: 'recipient',
      header: 'Destinatario',
      accessor: (row) => this.attempt(row).recipient || '—',
    },
    {
      key: 'templateKey',
      header: 'Plantilla',
      accessor: (row) => this.attempt(row).templateKey || '—',
    },
    {
      key: 'status',
      header: 'Estado',
      type: 'status',
      statusTones: Object.fromEntries(
        NOTIFICATION_STATUSES.map((status) => [
          NOTIFICATION_STATUS_META[status].label,
          NOTIFICATION_STATUS_META[status].tone,
        ]),
      ),
      filter: {
        kind: 'select',
        options: NOTIFICATION_STATUSES.map((status) => ({
          value: status,
          label: NOTIFICATION_STATUS_META[status].label,
        })),
      },
      accessor: (row) => notificationStatusLabel(this.attempt(row).status),
    },
  ];

  readonly selected = signal<NotificationResponse | null>(null);

  attempt(row: TableRow): NotificationResponse {
    return row as NotificationResponse;
  }

  onQueryChange(query: TableQuery): void {
    this.query.set(query);
  }

  retry(): void {
    this.resource.reload();
  }

  openDetail(attempt: NotificationResponse): void {
    this.selected.set(attempt);
    this.detailDialog = this.modals.open(this.detailTemplate(), {
      title: 'Detalle de notificación',
    });
  }

  onDetailClosed(): void {
    this.detailDialog?.close();
    this.detailDialog = null;
    this.selected.set(null);
  }
}
