const nodemailer = require("nodemailer");
const logger = require("./logger");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    logger.warn("Email credentials are not configured; skipping email send.", {
      to,
      subject,
    });
    return;
  }

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  const tx = getTransporter();
  await tx.sendMail(mailOptions);
}

module.exports = {
  sendEmail,
};

