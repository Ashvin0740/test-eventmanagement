import mongoose from 'mongoose';
import { InferSchemaType } from 'mongoose';

const Event = new mongoose.Schema(
    {
        sTitle: { type: String, required: true },
        sDescription: { type: String, required: true },
        oLocation: {
            sAddress: String,
            sCity: String,
            sState: String,
            sCountry: String,
            nLatitude: { type: Number, required: true },
            nLongitude: { type: Number, required: true },
        },
        dEventDate: { type: Date, required: true },
        sCategory: { type: String, required: true },
        iOrganizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        sImageUrl: String,
        nMaxAttendees: Number,
        eStatus: {
            type: String,
            enum: ['active', 'cancelled', 'completed', 'deleted'],
            default: 'active',
        },
    },
    { timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

// Indexes for performance
Event.index({ 'oLocation.nLatitude': 1, 'oLocation.nLongitude': 1 }); // For geospatial queries
Event.index({ dEventDate: 1 }); // For date-based queries
Event.index({ iOrganizerId: 1 }); // For organizer queries
Event.index({ sCategory: 1 }); // For category filtering
Event.index({ eStatus: 1 }); // For status filtering
Event.index({ dCreatedDate: -1 }); // For trending events

export type TEvent = InferSchemaType<typeof Event>;

export default mongoose.model('events', Event);
