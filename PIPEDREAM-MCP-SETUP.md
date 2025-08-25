# Triggering Pipedream Workflows from Claude Desktop via MCP

## Check Available MCP Tools

First, in Claude Desktop, ask:
```
What Pipedream MCP tools are available?
```

Or:
```
List all available MCP tools
```

## Common Pipedream MCP Commands

The Pipedream MCP typically provides tools like:

### 1. List Workflows
```
List my Pipedream workflows
```

### 2. Trigger Workflow by ID
```
Trigger Pipedream workflow [workflow_id] with data: {"email": "test@example.com", "first_name": "Test"}
```

### 3. Trigger Workflow by Name
```
Run my "Create Chargebee Customer" workflow with this data:
{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

## If MCP Tools Aren't Available

If the Pipedream MCP doesn't expose workflow triggering, you may need to:

### Option 1: Update MCP Configuration

Check your Claude Desktop MCP config file (usually at `~/Library/Application Support/Claude/claude_desktop_config.json` on Mac) and ensure it includes:

```json
{
  "mcpServers": {
    "pipedream": {
      "command": "npx",
      "args": ["-y", "@pipedream/mcp-server"],
      "env": {
        "PIPEDREAM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Option 2: Use a Generic HTTP MCP

If Pipedream MCP doesn't support triggering, you could add a generic HTTP MCP server:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

Then use:
```
Make a POST request to https://YOUR-WEBHOOK-URL.m.pipedream.net with body: {"email": "test@example.com", "first_name": "Test"}
```

## Testing Your MCP Connection

Try these prompts in Claude Desktop:

1. **Check connection:**
   ```
   Test Pipedream MCP connection
   ```

2. **List available workflows:**
   ```
   Show my Pipedream workflows
   ```

3. **Get workflow details:**
   ```
   Show details for my Chargebee customer creation workflow
   ```

4. **Trigger with workflow name:**
   ```
   Execute my Pipedream workflow named "Create Chargebee Customer" with email "test@example.com" and first_name "Test"
   ```

## Workflow ID Method

If you know your workflow ID (found in Pipedream URL or workflow settings):

```
Trigger Pipedream workflow [p_abc123] with POST data:
{
  "email": "new.customer@example.com",
  "first_name": "New",
  "last_name": "Customer",
  "company": "Test Inc"
}
```

## Direct HTTP Alternative

If the Pipedream MCP doesn't support triggering but you have the fetch MCP:

```
Send POST request to https://eok5l6yzvjlz0o5.m.pipedream.net with headers {"Content-Type": "application/json"} and body {"email": "test@example.com", "first_name": "Test", "last_name": "User"}
```

## Troubleshooting

If none of these work, you may need to:

1. Update the Pipedream MCP server to the latest version
2. Check the Pipedream MCP documentation for the correct syntax
3. Ensure your API key has permissions to trigger workflows
4. Consider using a different MCP server that supports HTTP requests

The exact syntax depends on which version of the Pipedream MCP you have installed and how it's configured.