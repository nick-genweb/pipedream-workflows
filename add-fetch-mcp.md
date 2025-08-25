# Add HTTP/Fetch Capability to Claude Desktop

## Step 1: Open Claude Desktop Configuration

Open your Claude Desktop configuration file:

**On Mac:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**On Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

## Step 2: Add Fetch MCP Server

Add the fetch server to your existing configuration. Your file should look like this:

```json
{
  "mcpServers": {
    "pipedream": {
      // Your existing Pipedream config
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Complete example:**
```json
{
  "mcpServers": {
    "pipedream": {
      "command": "npx",
      "args": ["-y", "@pipedream/mcp-server"],
      "env": {
        "PIPEDREAM_API_KEY": "your_api_key_here"
      }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

## Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely (Cmd+Q on Mac, Alt+F4 on Windows)
2. Reopen Claude Desktop
3. The fetch MCP will install automatically on first use

## Step 4: Test the Fetch Tool

In Claude Desktop, try:

```
Fetch https://api.github.com/users/github
```

If it works, you should see GitHub's user data.

## Step 5: Trigger Your Chargebee Workflow

Now you can trigger your Pipedream workflow:

```
Make a POST request to https://YOUR-WEBHOOK-URL.m.pipedream.net with headers {"Content-Type": "application/json"} and body {"email": "test@example.com", "first_name": "Test", "last_name": "Customer"}
```

Or simpler:

```
POST to https://YOUR-WEBHOOK-URL.m.pipedream.net with JSON: {"email": "new.customer@example.com", "first_name": "New", "last_name": "Customer", "company": "Test Corp"}
```

## Alternative: Node.js Script MCP

If the fetch MCP doesn't work, you can create a custom MCP server for your workflow:

### Create a file: `chargebee-mcp-server.js`

```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

const WEBHOOK_URL = 'https://YOUR-WEBHOOK-URL.m.pipedream.net';

const server = new Server(
  {
    name: 'chargebee-workflow',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'create_chargebee_customer',
      description: 'Create a customer in Chargebee via Pipedream workflow',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email (required)' },
          first_name: { type: 'string', description: 'First name' },
          last_name: { type: 'string', description: 'Last name' },
          company: { type: 'string', description: 'Company name' },
          phone: { type: 'string', description: 'Phone number' },
        },
        required: ['email'],
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'create_chargebee_customer') {
    try {
      const response = await axios.post(WEBHOOK_URL, request.params.arguments, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

Then add to your config:
```json
{
  "mcpServers": {
    "chargebee": {
      "command": "node",
      "args": ["/path/to/chargebee-mcp-server.js"]
    }
  }
}
```

## Quick Solution

The fastest solution is adding the fetch MCP (Step 2 above). Once added and Claude Desktop is restarted, you'll be able to make HTTP requests directly to your Pipedream webhook URL.