import { useState, useRef } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import Button from '../components/ui/button/Button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Link,
  List,
  ListProperties,
  TodoList,
  Table,
  TableToolbar,
  MediaEmbed,
  BlockQuote,
  CodeBlock,
  Alignment,
  Font,
  FontColor,
  FontBackgroundColor,
  HorizontalLine,
  PageBreak,
  RemoveFormat,
  FindAndReplace,
  Autoformat,
  Mention,
  Indent,
  IndentBlock,
  Essentials,
  Paragraph,
  GeneralHtmlSupport,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

// Editor configuration with essential plugins
const editorConfig = {
  licenseKey: 'GPL', // Use GPL license for open source projects
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'alignment',
      '|',
      'bulletedList',
      'numberedList',
      'todoList',
      '|',
      'outdent',
      'indent',
      '|',
      'link',
      'mediaEmbed',
      'insertTable',
      'blockQuote',
      'codeBlock',
      '|',
      'horizontalLine',
      'pageBreak',
      '|',
      'findAndReplace',
      'removeFormat',
      '|',
      'undo',
      'redo',
    ],
  },
  plugins: [
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading,
    Link,
    List,
    ListProperties,
    TodoList,
    Table,
    TableToolbar,
    MediaEmbed,
    BlockQuote,
    CodeBlock,
    Alignment,
    Font,
    FontColor,
    FontBackgroundColor,
    HorizontalLine,
    PageBreak,
    RemoveFormat,
    FindAndReplace,
    Autoformat,
    Mention,
    Indent,
    IndentBlock,
    Essentials,
    Paragraph,
    GeneralHtmlSupport,
  ],
  fontSize: {
    options: [9, 11, 13, 'default', 17, 19, 21, 24, 27, 30, 33],
    supportAllValues: true,
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },
};

export default function ReportGenerator() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('New Report');
  const [editorData, setEditorData] = useState('<p>Start typing your report here...</p>');
  const [isExporting, setIsExporting] = useState(false);
  const [editorInstance, setEditorInstance] = useState<ClassicEditor | null>(null);

  // Export as PDF
  const exportToPDF = async () => {
    if (!previewRef.current) return;

    setIsExporting(true);
    try {
      // Wait a moment for any images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page with content
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export as HTML
  const exportToHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .content { line-height: 1.6; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin-left: 0; color: #666; }
    code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
  <div class="content">
    ${editorData}
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear editor
  const clearEditor = () => {
    if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
      if (editorInstance) {
        editorInstance.setData('');
      }
      setEditorData('');
      setTitle('New Report');
    }
  };

  // Insert template
  const insertTemplate = (template: string) => {
    const templates: Record<string, string> = {
      invoice: `<h2>Invoice Summary Report</h2>
<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background: #f5f5f5;">
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Invoice #</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Client</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Amount</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd;">INV-001</td>
      <td style="padding: 12px; border: 1px solid #ddd;">Client Name</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">1,000 TND</td>
      <td style="padding: 12px; border: 1px solid #ddd;">Paid</td>
    </tr>
  </tbody>
</table>
<p><strong>Total:</strong> 1,000 TND</p>`,
      
      financial: `<h2>Financial Report</h2>
<h3>Period: [Insert Period]</h3>

<h4>Revenue</h4>
<ul>
  <li>Product Sales: _____ TND</li>
  <li>Service Revenue: _____ TND</li>
  <li>Other Income: _____ TND</li>
</ul>

<h4>Expenses</h4>
<ul>
  <li>Operating Costs: _____ TND</li>
  <li>Salaries: _____ TND</li>
  <li>Other Expenses: _____ TND</li>
</ul>

<h4>Summary</h4>
<p>Net Profit/Loss: _____ TND</p>`,
      
      client: `<h2>Client Report</h2>
<h3>[Client Name]</h3>

<h4>Contact Information</h4>
<ul>
  <li>Email: </li>
  <li>Phone: </li>
  <li>Address: </li>
</ul>

<h4>Transaction History</h4>
<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background: #f5f5f5;">
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Date</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Description</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Amount</th>
    </tr>
  </thead>
  <tbody>
  </tbody>
</table>

<h4>Notes</h4>
<p>[Add your notes here]</p>`,
    };
    
    const newContent = templates[template] || '';
    if (editorInstance) {
      const currentData = editorInstance.getData();
      editorInstance.setData(currentData + newContent);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Report Generator" />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none transition-colors dark:text-white"
                placeholder="Report Title"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearEditor}
                className="text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={exportToHTML}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Export HTML
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Templates */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 py-1.5">Templates:</span>
            <Button variant="outline" size="sm" onClick={() => insertTemplate('invoice')}>Invoice Report</Button>
            <Button variant="outline" size="sm" onClick={() => insertTemplate('financial')}>Financial Report</Button>
            <Button variant="outline" size="sm" onClick={() => insertTemplate('client')}>Client Report</Button>
          </div>

          {/* CKEditor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[600px]">
            <div className="ckeditor-container">
              <CKEditor
                editor={ClassicEditor}
                config={editorConfig}
                data={editorData}
                onReady={(editor) => {
                  setEditorInstance(editor);
                }}
                onChange={(_, editor) => {
                  const data = editor.getData();
                  setEditorData(data);
                }}
              />
            </div>
          </div>

          {/* Off-screen preview div for PDF export - must be visible for html2canvas */}
          <div
            ref={previewRef}
            style={{
              position: 'absolute',
              left: '-9999px',
              top: 0,
              width: '210mm',
              padding: '20px',
              background: 'white',
              zIndex: -1,
            }}
          >
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>{title}</h1>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
              Generated on: {new Date().toLocaleString()}
            </p>
            <div
              style={{ lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: editorData }}
            />
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>This is a temporary report. Data is not saved. Download as PDF or HTML to keep your work.</p>
          </div>
        </div>
      </div>
    </>
  );
}
