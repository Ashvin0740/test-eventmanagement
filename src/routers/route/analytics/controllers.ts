import { Request, Response } from 'express';
import Event from '../../../models/Event.js';
import EventView from '../../../models/EventView.js';
import RSVP from '../../../models/RSVP.js';
import openweathermapService from '../../../services/openweathermap.js';
import mongoose from 'mongoose';

class AnalyticsController {
    // GET /analytics/event/:id - View count, RSVP breakdown, weather data
    async getEventAnalytics(req: Request, res: Response) {
        try {
            const eventId = req.params.iEventId;
            if (!eventId) return res.reply(message.badRequestCM('Event ID is required'));

            const event = await Event.findById(eventId).lean();
            if (!event) return res.reply(message.notFoundCM('Event not found'));

            // Get view count
            const viewCount = await EventView.countDocuments({ iEventId: eventId });

            // Get RSVP breakdown
            const rsvpBreakdown = await RSVP.aggregate([{ $match: { iEventId: new mongoose.Types.ObjectId(eventId) } }, { $group: { _id: '$eStatus', count: { $sum: 1 } } }]);

            const rsvpMap: any = {};
            rsvpBreakdown.forEach((item: any) => {
                rsvpMap[item._id] = item.count;
            });

            // Get weather data
            const weather = await openweathermapService.getWeather((event as any).oLocation.nLatitude, (event as any).oLocation.nLongitude);

            // Get recent views (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentViews = await EventView.countDocuments({
                iEventId: eventId,
                dCreatedDate: { $gte: sevenDaysAgo },
            });

            return res.reply(message.successCM('Analytics fetched'), {
                eventId,
                nTotalViews: viewCount,
                nRecentViews: recentViews,
                oRSVPBreakdown: {
                    going: rsvpMap.going || 0,
                    interested: rsvpMap.interested || 0,
                    'not-going': rsvpMap['not-going'] || 0,
                    total: (rsvpMap.going || 0) + (rsvpMap.interested || 0) + (rsvpMap['not-going'] || 0),
                },
                oWeather: weather,
            });
        } catch (error) {
            console.error('[analytics] :: controllers.getEventAnalytics :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }
}

export default new AnalyticsController();
