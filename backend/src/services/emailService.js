const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Prefer real SMTP if credentials are provided, regardless of environment
      const user = process.env.EMAIL_USER;
      const pass = process.env.EMAIL_PASS;
      const service = process.env.EMAIL_SERVICE; // e.g., 'gmail'
      const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.EMAIL_PORT) || 587;
      const forceTest = String(process.env.EMAIL_USE_TEST || 'false').toLowerCase() === 'true';

      if (!forceTest && user && pass) {
        if (service) {
          this.transporter = nodemailer.createTransport({
            service,
            auth: { user, pass }
          });
        } else {
          this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
          });
        }
        return;
      }

      // If in production without credentials, warn and disable transporter
      if (process.env.NODE_ENV === 'production') {
        console.error('Email credentials missing: set EMAIL_USER and EMAIL_PASS');
        this.transporter = null;
        return;
      }

      // Development fallback: use Ethereal test account
      this.createTestAccount();
    } catch (error) {
      console.error('Email service initialization error:', error);
    }
  }

  async createTestAccount() {
    try {
      // Create test account for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('📧 Test email account created:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
    } catch (error) {
      console.error('Failed to create test email account:', error);
      // Fallback to console logging
      this.transporter = null;
    }
  }

  async sendOTP(email, otp, type = 'verification') {
    try {
      if (!this.transporter) {
        // Fallback to console logging if no transporter
        console.log(`📧 OTP Email (${type}) for ${email}: ${otp}`);
        return {
          success: true,
          messageId: 'console-log',
          preview: null
        };
      }

      const subject = this.getSubject(type);
      const html = this.getEmailTemplate(otp, type);

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"BBD School" <sunil.bbdacademy@gmail.com>',
        to: email,
        subject: subject,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // For development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        const previewURL = nodemailer.getTestMessageUrl(info);
        console.log(`📧 Email sent to ${email}`);
        console.log(`📧 Preview URL: ${previewURL}`);
        
        return {
          success: true,
          messageId: info.messageId,
          preview: previewURL
        };
      }

      return {
        success: true,
        messageId: info.messageId,
        preview: null
      };

    } catch (error) {
      console.error('Email sending error:', error);
      
      // Fallback to console logging
      console.log(`📧 OTP Email (${type}) for ${email}: ${otp}`);
      
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  getSubject(type) {
    switch (type) {
      case 'login':
        return 'BBD School - Login Verification Code';
      case 'registration':
        return 'BBD School - Registration Verification Code';
      case 'password-reset':
        return 'BBD School - Password Reset Code';
      default:
        return 'BBD School - Verification Code';
    }
  }

  getEmailTemplate(otp, type) {
    const title = this.getSubject(type);
    const expiryMinutes = type === 'password-reset' ? 10 : 5;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .warning { background: #fef3cd; border: 1px solid #fecaca; border-radius: 4px; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BBD School Management System</h1>
            </div>
            <div class="content">
                <h2>Verification Code</h2>
                <p>Hello,</p>
                <p>You have requested a verification code for your BBD School account. Please use the following OTP to complete your ${type}:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <p><strong>This code will expire in ${expiryMinutes} minutes</strong></p>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share your verification code with anyone.
                </div>
                
                <p>If you have any questions or need assistance, please contact our support team.</p>
                
                <p>Best regards,<br>BBD School Administration</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2025 BBD School Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async verifyConnection() {
    try {
      if (!this.transporter) {
        return { success: false, message: 'No transporter configured' };
      }

      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();