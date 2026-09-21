import {
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Button } from '@shared/button/button';
import {
  CHART_NEUTRAL_FILL,
  CHART_NEUTRAL_STROKE,
  CHART_SELECTION_STROKE,
  ENTRY_TYPE_LABELS,
  OdontogramEntry,
  QUADRANT_1,
  QUADRANT_2,
  QUADRANT_3,
  QUADRANT_4,
  SURFACES,
  SurfaceId,
  TOOTH_NAMES,
  ToothState,
  surfaceColor,
  toothState,
  toothStatus,
} from '../odontogram-model';

export interface ToothSelection {
  readonly tooth: number;
  readonly surface: SurfaceId | null;
}

interface ToothView {
  readonly toothNumber: number;
  readonly state: ToothState;
}

// Interactive FDI chart: 32 teeth in 4 quadrants with 5 clickable surfaces.
@Component({
  selector: 'app-odontogram-chart',
  imports: [Button, NgTemplateOutlet],
  templateUrl: './odontogram-chart.html',
  host: { class: 'block' },
})
export class OdontogramChart {
  readonly entriesByTooth = input.required<ReadonlyMap<number, ReadonlyArray<OdontogramEntry>>>();
  readonly selectedTooth = input<number | null>(null);

  readonly toothSelected = output<ToothSelection>();
  readonly deselected = output<void>();

  private readonly toothButtons = viewChildren<ElementRef<HTMLButtonElement>>('toothButton');
  readonly tooltip = signal<{ tooth: number; left: number; top: number } | null>(null);
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;

  // Navigation order matches the visual row order: upper arch then lower arch.
  private static readonly NAV_ORDER = [...QUADRANT_1, ...QUADRANT_2, ...QUADRANT_4, ...QUADRANT_3];

  private readonly views = computed<ReadonlyMap<number, ToothView>>(() => {
    const lookup = this.entriesByTooth();
    const views = new Map<number, ToothView>();
    for (const toothNumber of OdontogramChart.NAV_ORDER) {
      views.set(toothNumber, { toothNumber, state: toothState(lookup.get(toothNumber) ?? []) });
    }
    return views;
  });

  readonly upperLeft = computed(() => QUADRANT_1.map((tooth) => this.viewFor(tooth)));
  readonly upperRight = computed(() => QUADRANT_2.map((tooth) => this.viewFor(tooth)));
  readonly lowerRight = computed(() => QUADRANT_4.map((tooth) => this.viewFor(tooth)));
  readonly lowerLeft = computed(() => QUADRANT_3.map((tooth) => this.viewFor(tooth)));

  readonly neutralFill = CHART_NEUTRAL_FILL;
  readonly neutralStroke = CHART_NEUTRAL_STROKE;
  readonly selectionStroke = CHART_SELECTION_STROKE;
  readonly missingStroke = 'var(--color-mid-gray)';
  readonly surfaces = SURFACES;

  selectTooth(tooth: number): void {
    this.toothSelected.emit({ tooth, surface: null });
  }

  selectSurface(tooth: number, surface: SurfaceId, event: Event): void {
    event.stopPropagation();
    this.toothSelected.emit({ tooth, surface });
  }

  tabIndexFor(tooth: number): number {
    const selected = this.selectedTooth();
    if (selected === null) {
      return tooth === QUADRANT_1[0] ? 0 : -1;
    }
    return tooth === selected ? 0 : -1;
  }

  describe(view: ToothView): string {
    const name = TOOTH_NAMES[view.toothNumber] ?? 'Pieza dental';
    return `Pieza ${view.toothNumber}, ${name}, ${toothStatus(view.state).label}`;
  }

  fillFor(view: ToothView, surface: SurfaceId): string {
    return surfaceColor(view.state, surface);
  }

  tooltipTitle(tooth: number): string {
    return `Pieza ${tooth} — ${TOOTH_NAMES[tooth] ?? ''}`;
  }

  tooltipStatus(tooth: number): string {
    const state = this.views().get(tooth)?.state;
    if (!state || state.entries.length === 0) {
      return 'Sin registros (Sana)';
    }
    if (state.isMissing) {
      return 'Pieza Ausente / Extraída';
    }
    const type = state.highestPriorityType;
    return `Estado: ${type ? ENTRY_TYPE_LABELS[type] : 'Con observaciones'}`;
  }

  onToothEnter(event: MouseEvent, tooth: number): void {
    this.clearHoverTimer();
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    this.hoverTimer = setTimeout(() => {
      this.tooltip.set({
        tooth,
        left: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
        top: rect?.top ?? 0,
      });
    }, 350);
  }

  onToothFocus(event: FocusEvent, tooth: number): void {
    this.clearHoverTimer();
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    this.tooltip.set({
      tooth,
      left: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
      top: rect?.top ?? 0,
    });
  }

  onToothLeave(): void {
    this.clearHoverTimer();
    this.tooltip.set(null);
  }

  onChartKeydown(event: KeyboardEvent): void {
    const order = OdontogramChart.NAV_ORDER;
    const current = this.selectedTooth() ?? order[0];
    const index = current !== undefined ? order.indexOf(current) : -1;
    if (index === -1) {
      return;
    }
    let next: number | null = null;
    if (event.key === 'ArrowRight') {
      next = (index + 1) % order.length;
    } else if (event.key === 'ArrowLeft') {
      next = (index - 1 + order.length) % order.length;
    } else if (event.key === 'ArrowDown') {
      next = (index + 16) % order.length;
    } else if (event.key === 'ArrowUp') {
      next = (index - 16 + order.length) % order.length;
    }
    if (next === null) {
      return;
    }
    event.preventDefault();
    const tooth = order[next];
    if (tooth !== undefined) {
      this.selectTooth(tooth);
      this.toothButtons()[next]?.nativeElement.focus();
    }
  }

  private viewFor(toothNumber: number): ToothView {
    return this.views().get(toothNumber) ?? { toothNumber, state: toothState([]) };
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }
}
