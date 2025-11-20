import mongoose from 'mongoose';
import { InferSchemaType } from 'mongoose';

const RSVP = new mongoose.Schema(
    {
        iUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        iEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'events', required: true },
        eStatus: {
            type: String,
            enum: ['going', 'interested', 'not-going'],
            required: true,
        },
    },
    { timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

RSVP.index({ iUserId: 1, iEventId: 1 }, { unique: true });

export type TRSVP = InferSchemaType<typeof RSVP>;

export default mongoose.model('rsvps', RSVP);
