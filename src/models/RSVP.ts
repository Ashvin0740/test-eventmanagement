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

// Indexes for performance
// RSVP.index({ iUserId: 1, iEventId: 1 }, { unique: true }); // One RSVP per user per event
// RSVP.index({ iEventId: 1, eStatus: 1 }); // For event attendee queries
// RSVP.index({ iUserId: 1, eStatus: 1 }); // For user's events queries

export type TRSVP = InferSchemaType<typeof RSVP>;

export default mongoose.model('rsvps', RSVP);
