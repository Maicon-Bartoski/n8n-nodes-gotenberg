# n8n-nodes-gotenberg

A custom n8n node to integrate with the Gotenberg API for converting documents to PDF.

## Features
- Convert URLs to PDF
- Convert HTML to PDF
- Convert Markdown to PDF
- Convert Office documents to PDF
- Custom API URL and optional authentication

## Installation
1. Install via npm:
   ```bash
   npm install n8n-nodes-gotenberg
   ```

2. Restart n8n

## Usage

### Prerequisites
You need access to a Gotenberg instance. You can run Gotenberg locally using Docker:

```bash
docker run --rm -p 3000:3000 gotenberg/gotenberg:7
```

### Node Configuration
1. Add the Gotenberg node to your workflow
2. Configure the Gotenberg API URL (e.g., http://localhost:3000)
3. Select the desired operation:
   - Convert URL to PDF
   - Convert HTML to PDF
   - Convert Markdown to PDF
   - Convert Office to PDF
4. Fill in the operation-specific fields
5. Configure additional options if needed

## License
[MIT](LICENSE.md)
