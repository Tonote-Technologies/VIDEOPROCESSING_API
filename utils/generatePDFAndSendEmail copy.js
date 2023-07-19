import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

export const generatePDFAndSendEmail = async () => {
  try {
    // Launch a headless browser instance
    const browser = await puppeteer.launch();

    // Open a new page
    const page = await browser.newPage();

    // Set the HTML content of the page
    const currentTime = new Date().toLocaleTimeString(); // Get current time
    const htmlContent = `
      <html>
        <head>
          <style>
            /* Your CSS styles here */
          </style>
        </head>
        <body>
          <!-- Your HTML content here -->
          <div> [${currentTime}] Hello World </div>
          <div>
            <iframe src="https://pdfobject.com/pdf/sample.pdf" width="100%" height="600px"></iframe>
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.parent.postMessage('pdfLoaded', '*');
              }, 5000); // Adjust the delay as needed
            });
          </script>
        </body>
      </html>
    `;
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait for the PDF to load completely
    await page.waitForTimeout(6000); // Adjust the delay as needed

    // Generate a PDF from the page
    const pdfOptions = {
      path: './public/pdf/outputFile.pdf',
      format: 'A4',
    };
    await page.pdf(pdfOptions);

    // Close the browser
    await browser.close();

    // Configure the email transporter
    var transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "9f7a0feed1bf54",
        pass: "4ace91a1750fbd"
      }
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
          path: './public/pdf/outputFile.pdf',
          contentType: 'application/pdf',
        },
      ],
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function to generate PDF and send email
generatePDFAndSendEmail();
