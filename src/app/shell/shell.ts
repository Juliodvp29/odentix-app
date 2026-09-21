import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { CurrentUser, SessionService } from '@core/auth/session.service';
import { components } from '@core/api/schema';
import { BrandMark } from '@shared/brand-mark/brand-mark';
import { Icon, IconName } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { initialsOf } from '@shared/table/table-models';

export type UserRole = NonNullable<components['schemas']['UserSummaryDto']['role']>;

export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
  readonly exact?: boolean;
  readonly roles: ReadonlyArray<UserRole>;
}

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    path: '/',
    label: 'Panel principal',
    icon: 'layout-dashboard',
    exact: true,
    roles: ['propietario', 'odontologo', 'recepcion', 'auxiliar', 'especialista_externo'],
  },
  {
    path: '/patients',
    label: 'Pacientes',
    icon: 'users',
    roles: ['propietario', 'odontologo', 'recepcion', 'auxiliar'],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  propietario: 'Propietario',
  odontologo: 'Odontólogo',
  recepcion: 'Recepción',
  auxiliar: 'Auxiliar',
  especialista_externo: 'Especialista externo',
};

export function visibleNavItems(
  items: ReadonlyArray<NavItem>,
  role: UserRole | null | undefined,
): ReadonlyArray<NavItem> {
  if (!role) {
    return [];
  }
  return items.filter((item) => item.roles.includes(role));
}

@Component({
  selector: 'app-shell',
  imports: [BrandMark, Icon, IconButton, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);

  readonly user = computed<CurrentUser | null>(() => this.session.currentUser());
  readonly initials = computed(() => initialsOf(this.user()?.fullName ?? ''));
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  readonly visibleItems = computed(() => visibleNavItems(NAV_ITEMS, this.user()?.role));

  logout(): void {
    this.auth.logout().subscribe();
  }
}
