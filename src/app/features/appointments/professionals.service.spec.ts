import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import {
  ProfessionalResponse,
  ProfessionalsService,
  toDirectoryOptions,
} from './professionals.service';

describe('ProfessionalsService', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfessionalsService, provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(ProfessionalsService);
    TestBed.tick();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch active professionals and rooms', () => {
    const professionalsRequest = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/professionals'),
    );
    expect(professionalsRequest.request.method).toBe('GET');
    expect(professionalsRequest.request.params.get('onlyActive')).toBe('true');
    professionalsRequest.flush([{ id: 'prof-1', fullName: 'Ada Luz' }]);

    const roomsRequest = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/rooms'));
    expect(roomsRequest.request.method).toBe('GET');
    roomsRequest.flush([{ id: 'room-1', name: 'Box 1' }]);
  });
});

describe('toDirectoryOptions', () => {  it('should sort by name and skip entries without id', () => {
    expect(
      toDirectoryOptions([
        { id: 'prof-2', fullName: 'Mario Bros' },
        { id: 'prof-1', fullName: 'Ada Luz' },
        { fullName: 'Sin id' },
      ]),
    ).toEqual([
      { id: 'prof-1', name: 'Ada Luz' },
      { id: 'prof-2', name: 'Mario Bros' },
    ]);
  });

  it('should support rooms by name and fall back without one', () => {
    expect(toDirectoryOptions([{ id: 'room-1', name: 'Box 1' }])).toEqual([
      { id: 'room-1', name: 'Box 1' },
    ]);
    expect(toDirectoryOptions([{ id: 'room-2' }])).toEqual([
      { id: 'room-2', name: 'Sin nombre' },
    ]);
  });
});

describe('ProfessionalsService creation', () => {
  it('should post a new professional', async () => {
    const api = { post: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ProfessionalsService, { provide: ApiClient, useValue: api }],
    });
    const service = TestBed.inject(ProfessionalsService);
    const created: ProfessionalResponse = { id: 'prof-9', fullName: 'Nuevo Médico' };
    api.post.mockReturnValue(of(created));

    let result: ProfessionalResponse | undefined;
    service
      .createProfessional({ fullName: 'Nuevo Médico', isExternal: true })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/professionals', {
      fullName: 'Nuevo Médico',
      isExternal: true,
    });
    expect(result).toEqual(created);
  });
});
