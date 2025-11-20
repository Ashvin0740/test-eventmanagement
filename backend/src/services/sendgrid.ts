import env from '../config/env.js';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

class SendGridService {
    private apiKey: string;
    private fromEmail: string;

    constructor() {
        this.apiKey = env.sendgrid.apiKey;
        this.fromEmail = env.sendgrid.fromEmail;
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            if (!this.apiKey) {
                console.warn('[sendgrid] API key not configured, skipping email send');
                return false;
            }

            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [
                        {
                            to: [{ email: options.to }],
                            subject: options.subject,
                        },
                    ],
                    from: { email: options.from || this.fromEmail },
                    content: [
                        {
                            type: 'text/html',
                            value: options.html,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[sendgrid] Failed to send email:', response.status, errorText);
                return false;
            }

            console.log('[sendgrid] Email sent successfully to:', options.to);
            return true;
        } catch (error) {
            console.error('[sendgrid] Error sending email:', error);
            return false;
        }
    }

    async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Event Platform!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${userName}!</h2>
                        <p>Thank you for registering with our Event Discovery & Management Platform.</p>
                        <p>You can now:</p>
                        <ul>
                            <li>Discover exciting events near you</li>
                            <li>RSVP to events you're interested in</li>
                            <li>Create and manage your own events</li>
                            <li>Connect with other event enthusiasts</li>
                        </ul>
                        <p>Get started by exploring events in your area!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Event Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: email,
            subject: 'Welcome to Event Platform!',
            html,
        });
    }

    async sendVerificationEmail(email: string, token?: string, sLink?: string): Promise<boolean> {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button {
                        display: inline-block;
                        background-color: #FF9800;
                        color: white;
                        padding: 12px 28px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-size: 16px;
                        margin: 20px 0;
                        font-weight: bold;
                        letter-spacing: 1px;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                        transition: background 0.2s;
                    }
                    .button:hover { background-color: #e57c00; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification Required</h1>
                    </div>
                    <div class="content">
                        <h2>Hello!</h2>
                        <p>Thank you for registering with our Event Discovery & Management Platform.</p>
                        <p>Please verify your email address to activate your account and start exploring events:</p>
                        <p>
                            <a href="${sLink}" class="button">Verify Email</a>
                        </p>
                        <p>If you did not sign up for this account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Event Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail({
            to: email,
            subject: 'Please Verify Your Email Address',
            html,
        });
    }

    async sendRSVPNotificationEmail(organizerEmail: string, organizerName: string, attendeeName: string, eventTitle: string): Promise<boolean> {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New RSVP for Your Event!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${organizerName}!</h2>
                        <p><strong>${attendeeName}</strong> has RSVP'd to your event:</p>
                        <h3>${eventTitle}</h3>
                        <p>Check your dashboard to see all attendees and manage your event.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Event Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: organizerEmail,
            subject: `New RSVP: ${eventTitle}`,
            html,
        });
    }
}

export default new SendGridService();
