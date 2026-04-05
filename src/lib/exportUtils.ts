import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Traffic Data');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = (data: any[], title: string, fileName: string) => {
  const doc = new jsPDF();
  doc.text(title, 20, 10);
  
  const headers = Object.keys(data[0] || {});
  const body = data.map(item => Object.values(item));

  doc.autoTable({
    head: [headers],
    body: body,
  });
  
  doc.save(`${fileName}.pdf`);
};

export const exportToWord = (data: any[], title: string, fileName: string) => {
  // Simple Word export using HTML blob
  const headers = Object.keys(data[0] || {}).map(h => `<th>${h}</th>`).join('');
  const rows = data.map(item => `<tr>${Object.values(item).map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
  
  const html = `
    <html>
      <head><meta charset='utf-8'></head>
      <body>
        <h1>${title}</h1>
        <table border='1'>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
  
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
