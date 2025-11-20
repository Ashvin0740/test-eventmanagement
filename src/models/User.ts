import mongoose from 'mongoose';
import { InferSchemaType } from 'mongoose';

const User = new mongoose.Schema(
    {
        sEmail: { type: String, required: true },
        sPassword: { type: String, required: true },
        sUserName: { type: String, required: true },
        sProfilePic: String,
        oLocation: {
            sCountry: String,
            sState: String,
            sCity: String,
            nLatitude: Number,
            nLongitude: Number,
        },
        sAuthToken: String,
        sVerificationToken: String,
        bEmailVerified: { type: Boolean, default: false },
        eStatus: {
            type: String,
            enum: ['y', 'n', 'd'],
            default: 'y',
        },
    },
    { timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

User.index({ sEmail: 1 });
User.index({ 'oLocation.nLatitude': 1, 'oLocation.nLongitude': 1 });

export type TUser = InferSchemaType<typeof User>;

export default mongoose.model('users', User);
