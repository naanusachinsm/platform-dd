import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type PDFDoc = InstanceType<typeof PDFDocument>;

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountPercent: number;
  lineTotal: number;
}

interface DocumentData {
  type: 'ESTIMATE' | 'INVOICE';
  number: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  customerName?: string;
  customerEmail?: string;
  companyName?: string;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currency: string;
  notes?: string;
  terms?: string;
  items: LineItem[];
  orgName?: string;
  generatedBy?: string;
}

interface PdfContext {
  orgName?: string;
  generatedBy?: string;
}

const ACCENT = '#000000';
const ACCENT_LIGHT = '#e5e7eb';
const TEXT_DARK = '#000000';
const TEXT_MID = '#374151';
const TEXT_LIGHT = '#6b7280';
const BG_ROW = '#f3f4f6';

@Injectable()
export class FinancePdfService {
  private readonly logger = new Logger(FinancePdfService.name);

  async generateEstimatePdf(estimate: any, ctx?: PdfContext): Promise<Buffer> {
    const data: DocumentData = {
      type: 'ESTIMATE',
      number: estimate.estimateNumber,
      status: estimate.status,
      issueDate: estimate.issueDate,
      validUntil: estimate.validUntil,
      customerName: estimate.customerName || estimate.crmCompany?.name,
      customerEmail: estimate.customerEmail || estimate.crmContact?.email,
      companyName: estimate.crmCompany?.name,
      subtotal: parseFloat(estimate.subtotal) || 0,
      taxTotal: parseFloat(estimate.taxTotal) || 0,
      discountAmount: parseFloat(estimate.discountAmount) || 0,
      total: parseFloat(estimate.total) || 0,
      currency: estimate.currency || 'INR',
      notes: estimate.notes,
      terms: estimate.terms,
      items: this.mapItems(estimate.items),
      orgName: ctx?.orgName,
      generatedBy: ctx?.generatedBy,
    };
    return this.generateDocument(data);
  }

  async generateInvoicePdf(invoice: any, ctx?: PdfContext): Promise<Buffer> {
    const data: DocumentData = {
      type: 'INVOICE',
      number: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      customerName: invoice.customerName || invoice.crmCompany?.name,
      customerEmail: invoice.customerEmail || invoice.crmContact?.email,
      companyName: invoice.crmCompany?.name,
      subtotal: parseFloat(invoice.subtotal) || 0,
      taxTotal: parseFloat(invoice.taxTotal) || 0,
      discountAmount: parseFloat(invoice.discountAmount) || 0,
      total: parseFloat(invoice.total) || 0,
      amountPaid: parseFloat(invoice.amountPaid) || 0,
      amountDue: parseFloat(invoice.amountDue) || 0,
      currency: invoice.currency || 'INR',
      notes: invoice.notes,
      terms: invoice.terms,
      items: this.mapItems(invoice.items),
      orgName: ctx?.orgName,
      generatedBy: ctx?.generatedBy,
    };
    return this.generateDocument(data);
  }

  private mapItems(items: any[]): LineItem[] {
    return (items || []).map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      taxAmount: parseFloat(item.taxAmount) || 0,
      discountPercent: parseFloat(item.discountPercent) || 0,
      lineTotal: parseFloat(item.lineTotal) || 0,
    }));
  }

  private async generateDocument(data: DocumentData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => reject(error));

        const m = 50;
        const pw = doc.page.width;
        const cw = pw - m * 2;
        const cs = this.sym(data.currency);

        this.drawAccentBar(doc, pw);
        this.drawTitle(doc, data, m);
        this.drawOrgInfo(doc, data, m);
        this.drawInfoColumns(doc, data, m, cw, cs);
        this.drawTable(doc, data, m, cw, cs);
        this.drawTotals(doc, data, m, cw, cs);
        this.drawTerms(doc, data, m, cw);
        this.drawFooter(doc, data, m, pw, cw);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawAccentBar(doc: PDFDoc, pw: number): void {
    doc.rect(pw - 6, 0, 6, doc.page.height).fill('#000000');
    doc.rect(pw - 16, 0, 6, doc.page.height).fill('#d1d5db');
  }

  private drawTitle(doc: PDFDoc, data: DocumentData, m: number): void {
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor(ACCENT)
      .text(data.type, m, m);
  }

  private drawOrgInfo(doc: PDFDoc, data: DocumentData, m: number): void {
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_DARK);
    doc.text(data.orgName || '', m);

    if (data.generatedBy) {
      doc.fontSize(9).font('Helvetica').fillColor(TEXT_MID);
      doc.text(data.generatedBy);
    }

    doc.moveDown(1.2);
  }

  private drawInfoColumns(doc: PDFDoc, data: DocumentData, m: number, cw: number, cs: string): void {
    const startY = doc.y;
    const col1 = cw * 0.35;
    const col2 = cw * 0.35;
    const col3 = cw * 0.30;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT).text('BILL TO', m, startY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_DARK);
    doc.text(data.customerName || '—', m, doc.y + 3);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_MID);
    if (data.companyName && data.companyName !== data.customerName) doc.text(data.companyName);
    if (data.customerEmail) doc.text(data.customerEmail);
    const col1Bottom = doc.y;

    const label = data.type === 'ESTIMATE' ? 'ESTIMATE' : 'INVOICE';
    const col3X = m + col1 + col2;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT).text(`${label} #`, col3X, startY);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_DARK).text(data.number, col3X, doc.y + 3);

    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT).text(`${label} DATE`, col3X);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_DARK).text(this.fmtDate(data.issueDate), col3X, doc.y + 2);

    if (data.dueDate) {
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT).text('DUE DATE', col3X);
      doc.fontSize(9).font('Helvetica').fillColor(TEXT_DARK).text(this.fmtDate(data.dueDate), col3X, doc.y + 2);
    }

    if (data.validUntil) {
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT).text('VALID UNTIL', col3X);
      doc.fontSize(9).font('Helvetica').fillColor(TEXT_DARK).text(this.fmtDate(data.validUntil), col3X, doc.y + 2);
    }

    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT).text('STATUS', col3X);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_DARK).text(data.status, col3X, doc.y + 2);

    doc.y = Math.max(doc.y, col1Bottom) + 20;
  }

  private drawTable(doc: PDFDoc, data: DocumentData, m: number, cw: number, cs: string): void {
    const cols = { qty: 50, desc: cw - 50 - 110 - 110, price: 110, amount: 110 };
    const headerH = 24;
    const headerY = doc.y;

    doc.rect(m, headerY, cw, headerH).fill(ACCENT);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    let x = m + 8;
    doc.text('QTY', x, headerY + 7, { width: cols.qty });
    x += cols.qty;
    doc.text('DESCRIPTION', x, headerY + 7, { width: cols.desc });
    x += cols.desc;
    doc.text('UNIT PRICE', x, headerY + 7, { width: cols.price, align: 'right' });
    x += cols.price;
    doc.text('AMOUNT', x, headerY + 7, { width: cols.amount - 8, align: 'right' });

    doc.y = headerY + headerH;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const rowY = doc.y;
      const rowH = 22;

      if (rowY + rowH > doc.page.height - 100) {
        doc.addPage();
        this.drawAccentBar(doc, doc.page.width);
      }

      if (i % 2 === 0) {
        doc.rect(m, rowY, cw, rowH).fill(BG_ROW);
      }

      doc.fontSize(9).font('Helvetica').fillColor(TEXT_DARK);
      x = m + 8;
      doc.text(item.quantity.toString(), x, rowY + 5, { width: cols.qty });
      x += cols.qty;
      doc.text(item.description, x, rowY + 5, { width: cols.desc });
      x += cols.desc;
      doc.text(`${cs}${this.fmt(item.unitPrice)}`, x, rowY + 5, { width: cols.price, align: 'right' });
      x += cols.price;
      doc.font('Helvetica-Bold').text(`${cs}${this.fmt(item.lineTotal)}`, x, rowY + 5, { width: cols.amount - 8, align: 'right' });

      doc.y = rowY + rowH;
    }

    doc.moveDown(0.5);
  }

  private drawTotals(doc: PDFDoc, data: DocumentData, m: number, cw: number, cs: string): void {
    const rightX = m + cw - 220;
    const labelW = 120;
    const valW = 100;

    const row = (label: string, value: string, bold = false) => {
      doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(TEXT_MID);
      doc.text(label, rightX, doc.y, { width: labelW, align: 'right' });
      doc.moveUp();
      doc.fillColor(TEXT_DARK).text(value, rightX + labelW, doc.y, { width: valW, align: 'right' });
      doc.moveDown(0.3);
    };

    row('Subtotal', `${cs}${this.fmt(data.subtotal)}`);
    if (data.taxTotal > 0) row('Tax', `${cs}${this.fmt(data.taxTotal)}`);
    if (data.discountAmount > 0) row('Discount', `-${cs}${this.fmt(data.discountAmount)}`);

    doc.moveDown(0.3);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(ACCENT)
      .text('TOTAL', rightX, doc.y, { width: labelW, align: 'right' });
    doc.moveUp();
    doc.text(`${cs}${this.fmt(data.total)}`, rightX + labelW, doc.y, { width: valW, align: 'right' });

    if (data.type === 'INVOICE') {
      doc.moveDown(0.6);
      if ((data.amountPaid ?? 0) > 0) {
        row('Paid', `${cs}${this.fmt(data.amountPaid!)}`);
      }
      if ((data.amountDue ?? 0) > 0) {
        doc.moveDown(0.2);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Balance Due', rightX, doc.y, { width: labelW, align: 'right' });
        doc.moveUp();
        doc.text(`${cs}${this.fmt(data.amountDue!)}`, rightX + labelW, doc.y, { width: valW, align: 'right' });
      }
    }

    doc.moveDown(2);
  }

  private drawTerms(doc: PDFDoc, data: DocumentData, m: number, cw: number): void {
    if (doc.y > doc.page.height - 120) doc.addPage();

    if (data.notes) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT).text('NOTES', m);
      doc.fontSize(9).font('Helvetica').fillColor(TEXT_MID).text(data.notes, m, doc.y + 3, { width: cw - 30 });
      doc.moveDown(1);
    }

    if (data.terms) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT).text('TERMS & CONDITIONS', m);
      doc.fontSize(9).font('Helvetica').fillColor(TEXT_MID).text(data.terms, m, doc.y + 3, { width: cw - 30 });
      doc.moveDown(1);
    }
  }

  private drawFooter(doc: PDFDoc, data: DocumentData, m: number, pw: number, cw: number): void {
    const y = doc.page.height - 45;
    doc.moveTo(m, y - 8).lineTo(pw - m - 30, y - 8).strokeColor(ACCENT_LIGHT).lineWidth(1).stroke();

    const parts = [`#${data.number}`];
    if (data.generatedBy) parts.push(`Generated by ${data.generatedBy}`);
    parts.push(new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }));

    doc.fontSize(7).font('Helvetica').fillColor(TEXT_LIGHT);
    doc.text(parts.join('  |  '), m, y, { width: cw - 30, align: 'center' });
  }

  private sym(currency: string): string {
    return { INR: 'Rs.', USD: '$', EUR: 'EUR ', GBP: 'GBP ' }[currency] || currency + ' ';
  }

  private fmtDate(d: string): string {
    try {
      return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return d;
    }
  }

  private fmt(v: number): string {
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
