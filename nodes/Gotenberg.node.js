// Descrição do nó
module.exports.description = {
  displayName: 'Gotenberg',
  name: 'gotenberg',
  icon: 'file:gotenberg.svg', // Adicione um ícone SVG no repositório
  group: ['transform'],
  version: 1,
  subtitle: '={{$parameter["operation"]}}',
  description: 'Converts documents to PDF using the Gotenberg API',
  defaults: {
    name: 'Gotenberg',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'gotenbergApi',
      required: false,
    },
  ],
  properties: [
    // URL da API
    {
      displayName: 'Gotenberg API URL',
      name: 'apiUrl',
      type: 'string',
      default: 'http://localhost:3000',
      required: true,
      description: 'The URL of your Gotenberg instance (e.g., http://yourdomain.com:3000)',
    },
    // Operação
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      options: [
        {
          name: 'Convert URL to PDF',
          value: 'convertUrl',
          description: 'Convert a webpage URL to PDF',
        },
        {
          name: 'Convert HTML to PDF',
          value: 'convertHtml',
          description: 'Convert an HTML file or string to PDF',
        },
        {
          name: 'Convert Markdown to PDF',
          value: 'convertMarkdown',
          description: 'Convert Markdown files to PDF',
        },
        {
          name: 'Convert Office to PDF',
          value: 'convertOffice',
          description: 'Convert Office documents (Word, Excel, etc.) to PDF',
        },
      ],
      default: 'convertUrl',
      required: true,
    },
    // Campos para Convert URL
    {
      displayName: 'URL',
      name: 'url',
      type: 'string',
      default: '',
      required: true,
      displayOptions: {
        show: {
          operation: ['convertUrl'],
        },
      },
      description: 'The URL to convert to PDF',
    },
    // Campos para Convert HTML
    {
      displayName: 'HTML Content',
      name: 'htmlContent',
      type: 'string',
      typeOptions: {
        rows: 5,
      },
      default: '',
      required: true,
      displayOptions: {
        show: {
          operation: ['convertHtml'],
        },
      },
      description: 'The HTML content to convert to PDF (can be a file path or raw HTML)',
    },
    // Campos para Convert Markdown
    {
      displayName: 'HTML Wrapper',
      name: 'htmlWrapper',
      type: 'string',
      typeOptions: {
        rows: 5,
      },
      default: '<!DOCTYPE html><html><body>{{ toHTML "content.md" }}</body></html>',
      required: true,
      displayOptions: {
        show: {
          operation: ['convertMarkdown'],
        },
      },
      description: 'The HTML wrapper that includes the Markdown content',
    },
    {
      displayName: 'Markdown Content',
      name: 'markdownContent',
      type: 'string',
      typeOptions: {
        rows: 5,
      },
      default: '',
      required: true,
      displayOptions: {
        show: {
          operation: ['convertMarkdown'],
        },
      },
      description: 'The Markdown content to convert to PDF',
    },
    // Campos para Convert Office
    {
      displayName: 'Office File',
      name: 'officeFile',
      type: 'string',
      default: '',
      required: true,
      displayOptions: {
        show: {
          operation: ['convertOffice'],
        },
      },
      description: 'Path to the Office file (e.g., .docx, .xlsx) or binary data from previous node',
    },
    // Opções gerais
    {
      displayName: 'Output Filename',
      name: 'outputFilename',
      type: 'string',
      default: 'output.pdf',
      description: 'The name of the output PDF file',
    },
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      default: {},
      options: [
        {
          displayName: 'Landscape',
          name: 'landscape',
          type: 'boolean',
          default: false,
          description: 'Set the paper orientation to landscape',
        },
        {
          displayName: 'Page Ranges',
          name: 'nativePageRanges',
          type: 'string',
          default: '',
          description: 'Page ranges to print (e.g., 1-5, 8, 11-13)',
        },
      ],
    },
  ],
};

// Credenciais
module.exports.credentials = {
  gotenbergApi: {
    displayName: 'Gotenberg API Credentials',
    name: 'gotenbergApi',
    type: 'credentials',
    properties: [
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
      },
    ],
  },
};

// Implementação do nó
async function execute(params) {
  const { apiUrl, operation, url, htmlContent, htmlWrapper, markdownContent, officeFile, outputFilename, options } = params.nodeParameters;
  const items = params.items;
  const credentials = await this.getCredentials('gotenbergApi');

  const results = [];

  for (const item of items) {
    let endpoint, formData;

    // Configurar a requisição com base na operação
    switch (operation) {
      case 'convertUrl':
        endpoint = `${apiUrl}/forms/chromium/convert/url`;
        formData = { url: url || item.json.url };
        break;
      case 'convertHtml':
        endpoint = `${apiUrl}/forms/chromium/convert/html`;
        formData = { 'index.html': htmlContent || item.json.htmlContent };
        break;
      case 'convertMarkdown':
        endpoint = `${apiUrl}/forms/chromium/convert/markdown`;
        formData = {
          'index.html': htmlWrapper || item.json.htmlWrapper,
          'content.md': markdownContent || item.json.markdownContent,
        };
        break;
      case 'convertOffice':
        endpoint = `${apiUrl}/forms/libreoffice/convert`;
        formData = { 'file': officeFile || item.binary?.data?.data || item.json.officeFile };
        break;
      default:
        throw new Error('Operation not supported');
    }

    // Adicionar opções adicionais
    if (options) {
      Object.assign(formData, options);
    }

    try {
      // Configurar cabeçalhos e autenticação
      const headers = {
        'Content-Type': 'multipart/form-data',
        'Gotenberg-Output-Filename': outputFilename,
      };
      const requestOptions = {
        method: 'POST',
        url: endpoint,
        headers,
        body: formData,
        encoding: 'arraybuffer',
      };

      if (credentials) {
        requestOptions.auth = {
          username: credentials.username,
          password: credentials.password,
        };
      }

      // Fazer a requisição
      const response = await this.helpers.httpRequest(requestOptions);

      // Converter o PDF para base64
      const base64Data = Buffer.from(response).toString('base64');
      results.push({
        json: {
          pdf: base64Data,
          filename: outputFilename,
        },
        binary: {
          data: {
            data: base64Data,
            mimeType: 'application/pdf',
            fileName: outputFilename,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to execute ${operation}: ${error.message}`);
    }
  }

  return [results];
}

module.exports.execute = execute;
