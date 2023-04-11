import nodemailer from "nodemailer";
import handlebars from "handlebars";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  requireTLS: true,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME, // generated ethereal user
    pass: process.env.MAIL_PASSWORD, // generated ethereal password
  },
  // logger: true,
});

export const sendMail = async (email, first_name, to, subject) => {
  const filePath = path.join(__dirname, `../emails/${email}.html`);
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    username: first_name,
    email: first_name,
  };
  const html = template(replacements);

  const mail = await transporter.sendMail({
    from: "contact@abiodunsamuel.com",
    to,
    subject,
    html,
    headers: { "x-myheader": "shop fair" },
  });
  return mail.response;
};
