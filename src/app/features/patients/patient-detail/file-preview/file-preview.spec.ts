import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilePreview, isPreviewable } from './file-preview';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('isPreviewable', () => {
  it('should accept images and PDFs only', () => {
    expect(isPreviewable('image/png')).toBe(true);
    expect(isPreviewable('image/jpeg')).toBe(true);
    expect(isPreviewable('application/pdf')).toBe(true);
    expect(isPreviewable('text/plain')).toBe(false);
    expect(isPreviewable(undefined)).toBe(false);
    expect(isPreviewable(null)).toBe(false);
  });
});

describe('FilePreview', () => {
  let fixture: ComponentFixture<FilePreview>;
  let httpTesting: HttpTestingController;

  async function setup(contentType: string) {
    await TestBed.configureTestingModule({
      imports: [FilePreview],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(FilePreview);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('patientId', 'patient-1');
    fixture.componentRef.setInput('fileId', 'file-1');
    fixture.componentRef.setInput('fileName', 'rx.png');
    fixture.componentRef.setInput('contentType', contentType);
    fixture.detectChanges();
    await flushEffects();
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render an image from the signed url', async () => {
    await setup('image/png');
    httpTesting
      .expectOne((call) =>
        call.url.endsWith('/api/v1/patients/patient-1/files/file-1/download-url'),
      )
      .flush({ downloadUrl: 'https://files.example/rx.png' });
    await flushEffects();
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image.getAttribute('src')).toBe('https://files.example/rx.png');
    expect(image.getAttribute('alt')).toBe('rx.png');
  });

  it('should embed a PDF from the signed url', async () => {
    await setup('application/pdf');
    httpTesting
      .expectOne((call) =>
        call.url.endsWith('/api/v1/patients/patient-1/files/file-1/download-url'),
      )
      .flush({ downloadUrl: 'https://files.example/doc.pdf' });
    await flushEffects();
    fixture.detectChanges();
    const embed = fixture.nativeElement.querySelector('embed') as HTMLEmbedElement;
    expect(embed).not.toBeNull();
    expect(embed.getAttribute('src')).toBe('https://files.example/doc.pdf');
  });

  it('should show an error with retry on load failure', async () => {
    await setup('image/png');
    httpTesting
      .expectOne((call) =>
        call.url.endsWith('/api/v1/patients/patient-1/files/file-1/download-url'),
      )
      .flush({}, { status: 500, statusText: 'Error' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar la vista previa');
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    httpTesting
      .expectOne((call) =>
        call.url.endsWith('/api/v1/patients/patient-1/files/file-1/download-url'),
      )
      .flush({ downloadUrl: 'https://files.example/rx.png' });
    await flushEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
  });
});
