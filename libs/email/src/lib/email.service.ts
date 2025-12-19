import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
  const host = this.configService.get<string>('SMTP_HOST', 'localhost');
  const port = this.configService.get<number>('SMTP_PORT', 1025);
  const user = this.configService.get<string>('SMTP_USER');
  const pass = this.configService.get<string>('SMTP_PASS');

  // MailHog não usa TLS/SSL - conexão simples SMTP
  this.transporter = nodemailer. createTransport({
    host,
    port,
    secure:  false,  
    ignoreTLS: true,
    requireTLS: false,
    auth:  user && pass ? { user, pass } : undefined,
  } as any);

  this.logger.log(`📧 Email service initialized (${host}:${port}) - TLS disabled`);
}

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const from = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@syncflow.local'
    );

    try {
      const info = await this.transporter.sendMail({
        from,
        to:  options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`✅ Email sent to ${options.to}:  ${options.subject}`);
      this.logger.debug(`   Message ID: ${info.messageId}`);
    } catch (error:  any) {
      this.logger.error(`❌ Failed to send email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  async sendFileProcessedEmail(data: {
    email: string;
    fileName: string;
    fileId: string;
    hash: string;
    size: number;
    processedAt: string;
  }): Promise<void> {
    const subject = `✅ File Processed: ${data.fileName}`;

    const text = `
Hello! 

Your file has been successfully processed: 

File Name: ${data.fileName}
File ID: ${data.fileId}
SHA256 Hash: ${data.hash}
Size: ${this.formatBytes(data.size)}
Processed At: ${new Date(data.processedAt).toLocaleString()}

Thank you for using SyncFlow!
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border:  1px solid #ddd; border-top: none; }
    .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
    .label { font-weight: bold; color: #555; }
    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ File Processed Successfully</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>Your file has been successfully processed:</p>
      
      <div class="info">
        <p><span class="label">File Name:</span> ${data.fileName}</p>
        <p><span class="label">File ID:</span> <code>${data.fileId}</code></p>
        <p><span class="label">SHA256 Hash:</span> <code>${data.hash}</code></p>
        <p><span class="label">Size:</span> ${this.formatBytes(data.size)}</p>
        <p><span class="label">Processed At:</span> ${new Date(data.processedAt).toLocaleString()}</p>
      </div>

      <p>Thank you for using <strong>SyncFlow</strong>!</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendEmail({
      to: data.email,
      subject,
      text,
      html,
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}