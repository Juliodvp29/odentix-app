import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { AskResponse } from './assistant-models';
import { AssistantService } from './assistant.service';

const MOCK_ANSWER: AskResponse = {
  answer: 'Tienes 3 citas en riesgo esta semana.',
  model: 'odentix-assistant-1',
  fallback: false,
};

describe('AssistantService', () => {
  let service: AssistantService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AssistantService,
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            post: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(AssistantService);
    api = TestBed.inject(ApiClient);
  });

  it('should post the question to the ask endpoint', () => {
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_ANSWER));

    let result: AskResponse | undefined;
    service.ask('¿Qué citas están en riesgo?').subscribe((res) => {
      result = res;
    });

    expect(api.post).toHaveBeenCalledWith('/api/v1/assistant/ask', {
      question: '¿Qué citas están en riesgo?',
    });
    expect(result).toEqual(MOCK_ANSWER);
  });
});
