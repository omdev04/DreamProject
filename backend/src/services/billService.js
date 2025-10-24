const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Bill Generation Service
 * Creates professional PDF invoices for paid payments
 */

// Ensure bills directory exists
const billsDir = path.join(__dirname, '../../public/bills');
if (!fs.existsSync(billsDir)) {
  fs.mkdirSync(billsDir, { recursive: true });
}

/**
 * Generate a PDF bill/invoice for a payment
 * @param {Object} payment - Payment object with populated site_id and customer_id
 * @returns {String} - Filename of the generated bill
 */
const generateBill = async (payment) => {
  return new Promise((resolve, reject) => {
    try {
      // Generate filename
      const filename = `BILL-${payment.invoiceNumber}-${Date.now()}.pdf`;
      const filepath = path.join(billsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 40,
        info: {
          Title: `Invoice ${payment.invoiceNumber}`,
          Author: process.env.COMPANY_NAME || 'Panaglo'
        }
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Colors - Panaglo Brand Colors
      const primaryColor = '#667eea';
      const secondaryColor = '#6B7280';
      const successColor = '#10B981';
      const lightBg = '#F9FAFB';

      const pageWidth = 595.28; // A4 width in points
      const margin = 40;

      // ==================== HEADER SECTION ====================
      // Header Background
      doc.rect(0, 0, pageWidth, 120)
         .fill(primaryColor);

      // Company Name
      doc.fontSize(28)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text(process.env.COMPANY_NAME || 'Panaglo', margin, 35);
      
      // Tagline
      doc.fontSize(10)
         .fillColor('#FFFFFF')
         .font('Helvetica')
         .text('Website Management & Monitoring', margin, 70);
      
      // Contact Info in Header
      doc.fontSize(8)
         .fillColor('#FFFFFF')
         .text(`${process.env.COMPANY_EMAIL || 'support@panaglo.com'}  |  ${process.env.COMPANY_PHONE || '+91-9876543210'}`, margin, 90);

      // INVOICE Title (Right Side)
      doc.fontSize(32)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('INVOICE', pageWidth - 200, 40, { width: 160, align: 'right' });

      // PAID Badge
      doc.roundedRect(pageWidth - 140, 80, 100, 28, 5)
         .fill(successColor);
      doc.fontSize(12)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('PAID', pageWidth - 140, 87, { width: 100, align: 'center' });

      // ==================== INVOICE INFO & BILL TO ====================
      let currentY = 145;

      // Left Column - Invoice Details
      doc.fontSize(9)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text('Invoice Number:', margin, currentY);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(payment.invoiceNumber, margin + 100, currentY);

      currentY += 18;
      doc.fontSize(9)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text('Invoice Date:', margin, currentY);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(new Date(payment.verifiedAt || payment.paidDate).toLocaleDateString('en-IN', {
           day: '2-digit',
           month: 'short',
           year: 'numeric'
         }), margin + 100, currentY);

      currentY += 18;
      doc.fontSize(9)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text('Payment Date:', margin, currentY);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(new Date(payment.paidDate).toLocaleDateString('en-IN', {
           day: '2-digit',
           month: 'short',
           year: 'numeric'
         }), margin + 100, currentY);

      currentY += 18;
      doc.fontSize(9)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text('Service Period:', margin, currentY);
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica')
         .text(
           `${new Date(payment.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(payment.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 
           margin + 100, 
           currentY
         );

      // Right Column - Bill To
      const billToX = 320;
      currentY = 145;
      
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('BILL TO', billToX, currentY);

      currentY += 20;
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(payment.customer_id.name, billToX, currentY);

      currentY += 16;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(secondaryColor)
         .text(payment.customer_id.email, billToX, currentY);

      if (payment.customer_id.phone) {
        currentY += 14;
        doc.text(payment.customer_id.phone, billToX, currentY);
      }

      if (payment.customer_id.company) {
        currentY += 14;
        doc.font('Helvetica-Bold')
           .fillColor('#000000')
           .text(payment.customer_id.company, billToX, currentY);
      }

      // ==================== ITEMS TABLE ====================
      const tableTop = 280;
      
      // Table Header Background
      doc.rect(margin, tableTop, pageWidth - (margin * 2), 28)
         .fill(primaryColor);

      // Table Headers
      doc.fontSize(10)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('Description', margin + 10, tableTop + 9, { width: 260 })
         .text('Website', margin + 280, tableTop + 9, { width: 150 })
         .text('Amount', pageWidth - 150, tableTop + 9, { width: 110, align: 'right' });

      // Table Row
      const rowY = tableTop + 40;
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Website Management & Hosting Services', margin + 10, rowY, { width: 260 })
         .text(payment.site_id.domain, margin + 280, rowY, { width: 150 });

      doc.font('Helvetica-Bold')
         .text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, pageWidth - 150, rowY, { width: 110, align: 'right' });

      // Divider Line
      doc.moveTo(margin, rowY + 30)
         .lineTo(pageWidth - margin, rowY + 30)
         .strokeColor('#E5E7EB')
         .lineWidth(1)
         .stroke();

      // ==================== SUMMARY SECTION ====================
      const summaryY = rowY + 55;
      const summaryLabelX = pageWidth - 240;
      const summaryValueX = pageWidth - 150;

      // Subtotal
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text('Subtotal:', summaryLabelX, summaryY)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, summaryValueX, summaryY, { width: 110, align: 'right' });

      // Tax
      doc.fillColor(secondaryColor)
         .font('Helvetica')
         .text('Tax (GST):', summaryLabelX, summaryY + 20)
         .fillColor('#000000')
         .text('Rs. 0', summaryValueX, summaryY + 20, { width: 110, align: 'right' });

      // Total Background
      doc.rect(margin, summaryY + 50, pageWidth - (margin * 2), 36)
         .fill(lightBg);

      // Total Amount
      doc.fontSize(13)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT', margin + 10, summaryY + 60)
         .fontSize(16)
         .fillColor('#000000')
         .text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, summaryValueX, summaryY + 60, { width: 110, align: 'right' });

      // ==================== PAYMENT NOTES ====================
      if (payment.verificationNotes) {
        const notesY = summaryY + 110;
        doc.fontSize(9)
           .fillColor(secondaryColor)
           .font('Helvetica-Bold')
           .text('Payment Notes:', margin, notesY);
        doc.fontSize(8)
           .font('Helvetica')
           .text(payment.verificationNotes, margin, notesY + 15, { width: pageWidth - (margin * 2) });
      }

      // ==================== FOOTER ====================
      const footerY = 730;
      
      // Footer Divider
      doc.moveTo(margin, footerY)
         .lineTo(pageWidth - margin, footerY)
         .strokeColor(primaryColor)
         .lineWidth(2)
         .stroke();

      // Thank You Message
      doc.fontSize(11)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('Thank you for choosing Panaglo!', margin, footerY + 12, { align: 'center', width: pageWidth - (margin * 2) });
      
      // Company Info
      doc.fontSize(8)
         .fillColor(secondaryColor)
         .font('Helvetica')
         .text(
           `${process.env.COMPANY_NAME || 'Panaglo'} | ${process.env.COMPANY_EMAIL || 'support@panaglo.com'} | ${process.env.COMPANY_PHONE || '+91-9876543210'}`, 
           margin, footerY + 28, 
           { align: 'center', width: pageWidth - (margin * 2) }
         );
      
      if (process.env.COMPANY_WEBSITE) {
        doc.fillColor(primaryColor)
           .text(process.env.COMPANY_WEBSITE, margin, footerY + 40, { 
             align: 'center', 
             width: pageWidth - (margin * 2),
             link: process.env.COMPANY_WEBSITE 
           });
      }

      // Legal & Timestamp
      doc.fontSize(7)
         .fillColor('#9CA3AF')
         .text(
           `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN')} | This is a computer-generated invoice.`, 
           margin, footerY + 55, 
           { align: 'center', width: pageWidth - (margin * 2) }
         );
      
      // Copyright
      doc.fontSize(7)
         .text(
           `© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Panaglo'}. All rights reserved.`, 
           margin, footerY + 67, 
           { align: 'center', width: pageWidth - (margin * 2) }
         );

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filename);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get the public URL for a bill
 * @param {String} filename - Bill filename
 * @returns {String} - Public URL
 */
const getBillUrl = (filename) => {
  return `/bills/${filename}`;
};

/**
 * Delete a bill file
 * @param {String} filename - Bill filename
 */
const deleteBill = (filename) => {
  const filepath = path.join(billsDir, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

module.exports = {
  generateBill,
  getBillUrl,
  deleteBill
};
