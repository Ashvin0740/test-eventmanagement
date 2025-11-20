import { Request, Response } from 'express';

class ProfileController {
    async getUserProfile(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));
            return res.reply(message.successCM('User profile fetched'), {
                user: {
                    _id: user._id,
                    sEmail: user.sEmail,
                    sUserName: user.sUserName,
                    oLocation: user.oLocation,
                    eStatus: user.eStatus,
                    bEmailVerified: user.bEmailVerified,
                },
            });
        } catch (error) {
            console.error('[profile] :: controllers.register :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));

            user.sAuthToken = '';
            await user.save();

            return res.reply(message.successCM('User logged out successfully'));
        } catch (error) {
            console.error('[profile] :: controllers.login :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }
}

export default new ProfileController();
