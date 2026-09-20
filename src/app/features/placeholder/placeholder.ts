import { Component, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { Button } from '@shared/button/button';
import { FormField } from '@shared/form-field/form-field';
import { IconButton } from '@shared/icon-button/icon-button';
import { Link } from '@shared/link/link';
import { ModalService } from '@shared/modal/modal.service';
import { Select } from '@shared/select/select';
import { TextInput } from '@shared/text-input/text-input';
import { ToastService } from '@shared/toast/toast.service';
import { Toasts } from '@shared/toast/toasts';

// Temporary kit preview to judge the shared components visually.
// Removed once the first real feature lands.
@Component({
  selector: 'app-placeholder',
  imports: [Button, FormField, IconButton, Link, Select, TextInput, Toasts],
  template: `
    <div class="space-y-24 p-24">
      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Buttons</h2>
        <div class="flex flex-wrap gap-8">
          <app-button (clicked)="openDemo()">Primary</app-button>
          <app-button variant="secondary">Secondary</app-button>
          <app-button variant="ghost">Ghost</app-button>
          <app-button variant="danger">Danger</app-button>
          <app-button [disabled]="true">Disabled</app-button>
          <app-button [loading]="true">Loading</app-button>
        </div>
        <div class="flex items-center gap-8">
          <app-icon-button label="Close dialog">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" />
            </svg>
          </app-icon-button>
          <app-link href="/placeholder">Internal link</app-link>
          <app-link href="https://angular.dev" [external]="true">External link</app-link>
        </div>
      </section>

      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Form</h2>
        <form
          style="max-width: var(--content-max-width)"
          class="space-y-16"
          (submit)="submitDemo(); $event.preventDefault()"
        >
          <app-form-field label="Email" [field]="demoForm.email">
            <app-text-input [field]="demoForm.email" type="email" placeholder="you@example.com" />
          </app-form-field>
          <app-form-field label="Country" [field]="demoForm.country">
            <app-select [field]="demoForm.country">
              <option value="">Choose a country</option>
              <option value="co">Colombia</option>
            </app-select>
          </app-form-field>
          <app-button type="submit">Submit</app-button>
        </form>
      </section>

      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Modal</h2>
        <app-button (clicked)="openDemo()">Open demo modal</app-button>
        <ng-template #demo>
          <p>Demo modal body to judge the enter/exit transitions.</p>
        </ng-template>
      </section>

      <section class="space-y-16">
        <h2 class="text-heading-sm text-ink">Toasts</h2>
        <div class="flex flex-wrap gap-8">
          <app-button variant="secondary" (clicked)="toast('success')">Success</app-button>
          <app-button variant="secondary" (clicked)="toast('error')">Error</app-button>
          <app-button variant="secondary" (clicked)="toast('info')">Info</app-button>
          <app-button variant="secondary" (clicked)="toast('warning')">Warning</app-button>
        </div>
      </section>
    </div>
    <app-toasts />
  `,
})
export class Placeholder {
  private readonly modals = inject(ModalService);
  private readonly notifications = inject(ToastService);
  private readonly demo = viewChild('demo', { read: TemplateRef });

  readonly model = signal({ email: '', country: '' });
  readonly demoForm = form(this.model, (s) => {
    required(s.email, { message: 'Email is required' });
    email(s.email, { message: 'Enter a valid email address' });
    required(s.country, { message: 'Country is required' });
  });

  openDemo(): void {
    const template = this.demo();
    if (template) {
      this.modals.open(template, { title: 'Demo modal' });
    }
  }

  submitDemo(): void {
    submit(this.demoForm, async () => {});
  }

  toast(type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notifications.show(`Demo ${type} toast`, type);
  }
}
