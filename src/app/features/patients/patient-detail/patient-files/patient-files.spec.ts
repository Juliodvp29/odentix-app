import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientFiles } from './patient-files';

const FILES = [
  {
    id: 'file-1',
    fileName: 'radiografia.png',
    sizeBytes: 204800,
    createdAt: '2026-09-10T10:00:00Z',
  },
  { id: 'file-2', fileName: 'consentimiento.pdf', sizeBytes: 51200 },
];

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function pickFile(fixture: ComponentFixture<PatientFiles>, file: File): void {
  const picker = fixture.nativeElement.querySelector('#patient-file-input') as HTMLInputElement;
  Object.defineProperty(picker, 'files', { value: [file], configurable: true });
  picker.dispatchEvent(new Event('change'));
}

describe('PatientFiles', () => {
  let fixture: ComponentFixture<PatientFiles>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientFiles],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PatientFiles);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('patientId', 'patient-1');
    fixture.detectChanges();
    await flushEffects();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/patients')).flush({ content: [] });
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
  });

  it('should render files with size and date', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush(FILES);
    await flushEffects();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('radiografia.png');
    expect(text).toContain('200.0 KB');
    expect(text).toContain('consentimiento.pdf');
  });

  it('should show skeletons while loading', async () => {
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush([]);
    await flushEffects();
  });

  it('should show an empty state without files', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush([]);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin archivos');
  });

  it('should show an error with retry on load failure', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar los archivos');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush(FILES);
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('radiografia.png');
  });

  it('should upload with progress and refresh the list on completion', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush([]);
    await flushEffects();
    fixture.detectChanges();
    pickFile(fixture, new File(['data'], 'nuevo.pdf', { type: 'application/pdf' }));
    await flushEffects();
    const upload = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/patients/patient-1/files'),
    );
    expect(upload.request.method).toBe('POST');
    upload.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('50 %');
    upload.flush({ id: 'file-3', fileName: 'nuevo.pdf' });
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush([{ id: 'file-3', fileName: 'nuevo.pdf' }]);
    await flushEffects();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('nuevo.pdf');
    expect(text).not.toContain('Subiendo archivo');
  });

  it('should reject files over 15 MB without calling the backend', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush([]);
    await flushEffects();
    fixture.detectChanges();
    pickFile(
      fixture,
      new File([new ArrayBuffer(16 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' }),
    );
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('supera el límite de 15 MB');
    httpTesting.expectNone((call) => call.method === 'POST');
  });

  it('should open the signed download url on download', async () => {
    const opened: string[] = [];
    vi.spyOn(window, 'open').mockImplementation((url) => {
      opened.push(String(url));
      return null;
    });
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush(FILES);
    await flushEffects();
    fixture.detectChanges();
    const download = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Descargar'),
    ) as HTMLButtonElement;
    download.click();
    await flushEffects();
    httpTesting
      .expectOne((call) =>
        call.url.endsWith('/api/v1/patients/patient-1/files/file-1/download-url'),
      )
      .flush({ downloadUrl: 'https://files.example/radiografia.png' });
    await flushEffects();
    expect(opened).toEqual(['https://files.example/radiografia.png']);
  });

  it('should show an error when the download cannot be prepared', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/patients/patient-1/files'))
      .flush(FILES);
    await flushEffects();
    fixture.detectChanges();
    const download = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Descargar'),
    ) as HTMLButtonElement;
    download.click();
    await flushEffects();
    httpTesting
      .expectOne((call) =>
        call.url.endsWith('/api/v1/patients/patient-1/files/file-1/download-url'),
      )
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos preparar la descarga');
  });
});
