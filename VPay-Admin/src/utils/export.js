import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, generateExportFilename } from './helpers';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 22);
  
  // Add table
  doc.autoTable({
    startY: 30,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = row[col.accessor];
      if (col.cell) return col.cell(value, row);
      return value;
    })),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [6, 148, 231] },
  });
  
  doc.save(filename);
};

export const exportTransactionsToExcel = (transactions) => {
  const data = transactions.map(t => ({
    'Transaction ID': t.reference,
    'Date': formatDate(t.createdAt),
    'Type': t.type,
    'Amount': t.amount,
    'Status': t.status,
    'Description': t.description,
    'User': t.user?.email || '-',
  }));
  
  const filename = generateExportFilename('transactions', 'xlsx');
  exportToExcel(data, filename, 'Transactions');
};

export const exportUsersToExcel = (users) => {
  const data = users.map(u => ({
    'User ID': u.id,
    'Name': `${u.firstName} ${u.lastName}`,
    'Email': u.email,
    'Phone': u.phone,
    'KYC Status': u.kycStatus,
    'KYC Level': u.kycLevel,
    'Joined': formatDate(u.createdAt),
  }));
  
  const filename = generateExportFilename('users', 'xlsx');
  exportToExcel(data, filename, 'Users');
};

export const exportLoansToExcel = (loans) => {
  const data = loans.map(l => ({
    'Loan ID': l.id,
    'User': l.user?.email || '-',
    'Amount': l.amount,
    'Interest Rate': `${l.interestRate}%`,
    'Duration': `${l.duration} months`,
    'Status': l.status,
    'Applied': formatDate(l.createdAt),
    'Due Date': formatDate(l.dueDate),
  }));
  
  const filename = generateExportFilename('loans', 'xlsx');
  exportToExcel(data, filename, 'Loans');
};
