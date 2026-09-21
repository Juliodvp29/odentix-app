import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Temporary placeholder for feature modules not built yet.
// Removed as each feature lands its real routes.
@Component({
  selector: 'app-coming-soon',
  template: `
    <div class="mx-auto max-w-2xl py-64 text-center">
      <p class="text-caption font-medium uppercase text-mid-gray">Módulo en construcción</p>
      <h1 class="mt-8 text-heading text-ink">{{ title }}</h1>
      <p class="mt-8 text-body text-mid-gray">Esta sección aún no está disponible.</p>
    </div>
  `,
})
export class ComingSoon {
  private readonly route = inject(ActivatedRoute);

  readonly title: string = (this.route.snapshot.data['title'] as string | undefined) ?? '';
}
