import { Injectable } from '@angular/core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

@Injectable({
  providedIn: 'root',
})
export class McpClientService {
  private client: Client | null = null;

  async connectToServer(serverUrl: string) {
    // 1. Initialize the Transport (Streamable HTTP is used for modern browser-based clients)
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

    // 2. Initialize the Client
    this.client = new Client(
      { name: 'my-angular-mcp-client', version: '1.0.0' },
      { capabilities: {} },
    );

    // 3. Connect
    await this.client.connect(transport);
    console.log('Connected to MCP Server!');
  }

  async listTools() {
    if (!this.client) return [];
    // 4. Discover what the server can do
    const response = await this.client.listTools();
    return response.tools;
  }

  async callTool(name: string, args: any) {
    if (!this.client) throw new Error('Client not connected');
    // 5. Execute a specific tool
    return await this.client.callTool({
      name,
      arguments: args,
    });
  }
}
