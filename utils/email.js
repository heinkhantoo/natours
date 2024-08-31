const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Natours ${process.env.EMAIL_FROM}`;
  }

  newTransporter() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../view/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    if (process.env.NODE_ENV === 'production')
      this.from = 'heinkhantoo2017@gmail.com';

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html, {
        wordwrap: 130,
      }),
    };

    const send = await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Reset your password [valid for 10 minutes]'
    );
  }
};
