import mongoose from 'mongoose';
import { InferSchemaType } from 'mongoose';

const EventView = new mongoose.Schema(
    {
        iEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'events', required: true },
        iUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', sparse: true }, // Optional - can be anonymous
        sRemoteAddress: String,
        sUserAgent: String,
    },
    { timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

// // Indexes for analytics
EventView.index({ iEventId: 1, dCreatedDate: -1 }); // For event view analytics

export type TEventView = InferSchemaType<typeof EventView>;

export default mongoose.model('event_views', EventView);
