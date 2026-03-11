import { TestBed } from '@angular/core/testing';

import { McpClient } from './mcp-client';

describe('McpClient', () => {
  let service: McpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(McpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
