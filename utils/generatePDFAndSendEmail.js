import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';
import fs from 'fs';

export const generatePDFAndSendEmail = async () => {
  try {
    // Launch a headless browser instance
    const browser = await puppeteer.launch();

    // Open a new page
    const page = await browser.newPage();

    // Set the HTML content of the page
    const htmlContent = `
      <html>
        <head>
          <style>
            .signature {
              position: absolute;
              z-index: 1000;
            }
          </style>
        </head>
        <body></body>
      </html>
    `;
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate a PDF from the page
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Close the browser
    await browser.close();

    // Download the external PDFs
    const documentUploads = [
      {
        file_url: 'https://tonote-storage.s3.eu-west-3.amazonaws.com/test-uploads/document/99a27ced-905d-4b66-925a-17043e3844c0/64afa0ed85e41.pdf',
      },
      {
        file_url: 'https://tonote-storage.s3.eu-west-3.amazonaws.com/test-uploads/document/99a27ced-905d-4b66-925a-17043e3844c0/64afa0ed9b393.pdf',
      },
    ];

    const mergedPdf = await PDFDocument.create();

    // Loop through the document uploads
    for (let i = 0; i < documentUploads.length; i++) {
      const document = documentUploads[i];

      // Download the PDF
      const pdfBuffer = await fetch(document.file_url).then((response) => response.buffer());

      // Load the downloaded PDF
      const externalPdf = await PDFDocument.load(pdfBuffer);

      // Copy the pages from the downloaded PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(externalPdf, externalPdf.getPageIndices());

      // Add the copied pages to the merged PDF
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    // Process the signature images from the object array
    // Loop through the signature objects and add the signature image to the respective pages
    const signatures = [
      {
        file: 'https://tonote-storage.s3.eu-west-3.amazonaws.com/test-uploads/user/97eacc3f-de06-4d71-b1cf-0bc812e9e6d2/6406fc21201ff.png',
        tool_height: '49',
        tool_width: '95',
        tool_class: 'tool-box main-element',
        tool_pos_top: '360',
        tool_pos_left: '35',
        page: 0,
      },
      {
        file: 'https://tonote-storage.s3.eu-west-3.amazonaws.com/test-uploads/user/97eacc3f-de06-4d71-b1cf-0bc812e9e6d2/641459f64fb19.png',
        tool_height: '30',
        tool_width: '95',
        tool_class: 'tool-box main-element',
        tool_pos_top: '999',
        tool_pos_left: '72',
        page: 1,
      },
      {
        file: 'https://tonote-storage.s3.eu-west-3.amazonaws.com/test-uploads/user/97eacc3f-de06-4d71-b1cf-0bc812e9e6d2/63fcb43a0c8c8.png',
        tool_height: '49',
        tool_width: '95',
        tool_class: 'tool-box main-element',
        tool_pos_top: '392',
        tool_pos_left: '450.0078125',
        page: 2,
      },
    ];

    // Loop through the signature objects and add the signature image to the respective pages
    for (const signature of signatures) {
      const signatureImageBuffer = await fetch(signature.file).then((response) => response.buffer());
      const signatureImage = await mergedPdf.embedPng(signatureImageBuffer);

      const imageWidth = parseInt(signature.tool_width);
      const imageHeight = parseInt(signature.tool_height);
      const imageX = parseFloat(signature.tool_pos_left);
      const imageY = parseFloat(signature.tool_pos_top);

      const pageIndex = signature.page;

      if (pageIndex >= 0 && pageIndex < mergedPdf.getPageCount()) {
        const page = mergedPdf.getPage(pageIndex);
        page.drawImage(signatureImage, {
          x: imageX,
          y: page.getHeight() - imageY - imageHeight,
          width: imageWidth,
          height: imageHeight,
        });
      } else {
        console.error(`Invalid page index: ${pageIndex}`);
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const outputPath = `./public/pdf/${Date.now()}-outputFile.pdf`;
    fs.writeFileSync(outputPath, mergedPdfBytes); // Save the PDF to the specified output path

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '9f7a0feed1bf54',
        pass: '4ace91a1750fbd',
      },
    });

    // Compose the email message
    const mailOptions = {
      from: 'Akin Shafi',
      to: 'sakinropo@gmail.com',
      subject: 'PDF Attachment',
      text: 'Please find the attached PDF file.',
      attachments: [
        {
          filename: 'outputFile.pdf',
          path: outputPath, // Attach the PDF file from the specified output path
        },
      ],
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Call the function to generate PDF and send email
// generatePDFAndSendEmail();
