import nodemailer from 'nodemailer';
import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import _ from '../globals/lib/helper.js';
import env from '../config/env.js';
import dayjs from 'dayjs';

interface EmailBody {
    sEmail: string;
    nOTP?: number;
    sLink?: string;
    sUserName?: string;
    dDate?: string;
    attachment?: string;
    [key: string]: any;
}

interface EmailTemplate {
    subject: string;
    html: string;
}

type EmailType = (body: EmailBody) => EmailTemplate;

const getTemplate = (filename: string, body: EmailBody): string => {
    try {
        const date = _.Date.getDateWithTimezone();
        body.dDate = date.format('DD MMM YYYY, hh:mm A');
        body.dYear = date.year();

        const emailTemplatePath = path.join('src/services/seeds/email_templates', filename);
        try {
            fs.accessSync(emailTemplatePath);
        } catch (error) {
            throw new Error(`[getTemplate] :: Email template file not found: ${filename} :: ${error}`);
        }

        const template = fs.readFileSync(emailTemplatePath, 'utf-8');
        const renderedTemplate = ejs.render(template, body);
        return renderedTemplate;
    } catch (error) {
        throw new Error(`[getTemplate] :: Failed to process email template: ${filename} :: ${error}`);
    }
};

const collection = {
    accountActivation: (body: EmailBody) => ({
        subject: 'Account Activation',
        html: getTemplate('account_activation.html', body),
    }),
} as const;

const nodemailerService = {
    async send(type: EmailType, body: EmailBody): Promise<void> {
        try {
            if (!type || typeof type !== 'function') throw new Error('[nodemailer] :: services/nodemailer.ts :: Invalid email type provided');

            if (!body?.sEmail) throw new Error('[nodemailer] :: services/nodemailer.ts :: Email address is required');

            const emailTemplate = type(body);
            if (!emailTemplate?.subject || !emailTemplate?.html) throw new Error('[nodemailer] :: services/nodemailer.ts :: Failed to generate email template');

            const mailOptions = {
                from: env.smtp.email,
                to: body.sEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                attachments: body.attachment
                    ? [
                          {
                              filename: path.basename(body.attachment),
                              path: body.attachment,
                          },
                      ]
                    : [],
            };

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: env.smtp.email,
                    pass: env.smtp.password,
                },
            });

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);

            if (body.attachment) {
                try {
                    fs.unlinkSync(body.attachment);
                    console.log(`Successfully deleted attachment: ${body.attachment}`);
                } catch (unlinkError) {
                    console.error(`[nodemailer] :: services/nodemailer.ts:103 :: Nodemailer :: send :: Failed to delete attachment: ${body.attachment}`, unlinkError);
                }
            }
        } catch (error) {
            console.error('[nodemailer] :: services/nodemailer.ts:105 :: Nodemailer :: send :: error:', error);
            throw error;
        }
    },
};

export default { ...nodemailerService, collection };
