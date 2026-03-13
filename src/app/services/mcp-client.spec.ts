import { TestBed } from '@angular/core/testing';

import { McpClientService } from './mcp-client';

describe('McpClientService', () => {
  let service: McpClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(McpClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
