import { NextFunction, Request, Response } from 'express';
import User from '../../../models/User.js';
import nodemailerService from '../../../services/nodemailer.js';
import env from '../../../config/env.js';
import sendgridService from '../../../services/sendgrid.js';

class AuthController {
    async register(req: Request, res: Response) {
        try {
            const body = _.pick(req.body, ['sEmail', 'sPassword', 'sUserName', 'oLocation']);

            if (!body.sEmail) return res.reply(message.badRequestCM('Email is required'));
            if (!body.sPassword) return res.reply(message.badRequestCM('Password is required'));
            if (!body.sUserName) return res.reply(message.badRequestCM('Username is required'));

            // Validate password strength
            if (body.sPassword.length < 6) {
                return res.reply(message.badRequestCM('Password is too short'));
            }

            const existingUser = await User.findOne({ sEmail: body.sEmail });
            if (existingUser) return res.reply(message.alreadyExistsCM('Email already exists'));

            const newUser = new User({
                sEmail: body.sEmail,
                sPassword: _.encryptPassword(body.sPassword),
                eUserType: 'user',
                sUserName: body.sUserName,
                oLocation: body.oLocation || {},
                eStatus: 'y',
            });

            newUser.sVerificationToken = _.encodeToken({ sEmail: body.sEmail }, _.nVerificationTokenExpiresIn); // 3 minutes;

            await newUser.save();

            // // Send welcome email via SendGrid
            // sendgridService.sendWelcomeEmail(newUser.sEmail, newUser.sUserName).catch(err => {
            //     console.error('[user] Failed to send welcome email:', err);
            // });
            let sLink = `${env.baseUrl}/api/v1/auth/verify-email/${newUser.sVerificationToken}`;

            // Send verification email via SendGrid
            sendgridService.sendVerificationEmail(newUser.sEmail, _.encodeToken({ sEmail: body.sEmail }, _.nVerificationTokenExpiresIn), sLink).catch(err => {
                console.error('[user] Failed to send verification email:', err);
            });

            const token = _.encodeToken({ sEmail: newUser.sEmail, _id: newUser._id });
            newUser.sAuthToken = token;
            await newUser.save();

            return res.reply(message.successCM('User created'), {
                user: {
                    _id: newUser._id,
                    sEmail: newUser.sEmail,
                    sUserName: newUser.sUserName,
                },
                token,
            });
        } catch (error) {
            console.error('[user] :: controllers.register :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    async login(req: Request, res: Response) {
        try {
            const body = _.pick(req.body, ['sEmail', 'sPassword']);

            if (!body.sEmail) return res.reply(message.badRequestCM('Email is required'));
            if (!body.sPassword) return res.reply(message.badRequestCM('Password is required'));

            const user = await User.findOne({ sEmail: body.sEmail });
            if (!user) return res.reply(message.forbiddenCM('Invalid email or password'));
            if (user.eStatus === 'd') return res.reply(message.forbiddenCM('Account deleted'));
            if (user.eStatus === 'n') return res.reply(message.forbiddenCM('Account blocked'));
            if (_.encryptPassword(body.sPassword) !== user.sPassword) {
                return res.reply(message.forbiddenCM('Invalid email or password'));
            }
            if (!user.bEmailVerified) return res.reply(message.forbiddenCM('Email not verified. Please verify your email before logging in.'));

            const token = _.encodeToken({ sEmail: body.sEmail, _id: user._id });
            user.sAuthToken = token;
            await user.save();

            return res.reply(message.successCM('User logged in'), {
                user: {
                    _id: user._id,
                    sEmail: user.sEmail,
                    sUserName: user.sUserName,
                    oLocation: user.oLocation,
                },
                token,
            });
        } catch (error) {
            console.error('[user] :: controllers.login :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    async verifyEmail(req: Request, res: Response) {
        try {
            const token = req.params.sVerificationToken;
            console.log('Verification token:', token);
            if (!token) return res.reply(message.badRequestCM('Verification token is required'));

            const decodedToken: any = _.decodeToken(token);

            if (!decodedToken || decodedToken === 'jwt expired' || decodedToken === 'jwt malformed' || decodedToken.exp < Date.now() / 1000) {
                return res.status(400).render('email_verification_error', {
                    errorMsg: 'Your verification link is invalid or has expired. Please request a new verification email.',
                });
            }

            const user = await User.findOne({ sEmail: decodedToken.sEmail, sVerificationToken: token });
            if (!user) return res.reply(message.notFoundCM('User not found or already verified'));

            user.bEmailVerified = true;
            user.sVerificationToken = '';
            await user.save();

            return res.status(200).render('email_verification_success', { message: 'Your email address has been successfully verified.' });
        } catch (error) {
            console.error('[user] :: controllers.verifyEmail :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }
}

export default new AuthController();
