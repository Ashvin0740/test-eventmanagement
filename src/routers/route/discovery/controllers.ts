import { Request, Response } from 'express';
import Event from '../../../models/Event.js';
import RSVP from '../../../models/RSVP.js';
import EventView from '../../../models/EventView.js';
import redis from '../../../config/redis.js';
import mongoose from 'mongoose';

class DiscoveryController {
    // GET /events/nearby - Find events by location (lat, lng, radius_km)
    async getNearbyEvents(req: Request, res: Response) {
        try {
            console.log('getNearbyEvents called with query:', req.query);
            const lat = parseFloat(req.query.lat as string);
            const lng = parseFloat(req.query.lng as string);
            const radius_km = parseFloat((req.query.radius_km as string) || '25');

            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) || isNaN(radius_km)) {
                return res.reply(message.badRequestCM('Valid lat, lng and radius_km are required'));
            }

            const cacheKey = `nearby_events_${lat}_${lng}_${radius_km}`;
            const cached = await redis.getJson(cacheKey);
            if (cached) {
                return res.reply(message.successCM('Events fetched'), cached);
            }

            // Mongo geospatial query
            const events = await Event.find({
                eStatus: 'active',
                'oLocation.nLatitude': { $exists: true, $ne: null },
                'oLocation.nLongitude': { $exists: true, $ne: null },
                $expr: {
                    $lte: [
                        {
                            $divide: [
                                {
                                    $multiply: [
                                        6371,
                                        {
                                            $acos: {
                                                $add: [
                                                    {
                                                        $multiply: [{ $sin: { $degreesToRadians: '$oLocation.nLatitude' } }, Math.sin((lat * Math.PI) / 180)],
                                                    },
                                                    {
                                                        $multiply: [
                                                            { $cos: { $degreesToRadians: '$oLocation.nLatitude' } },
                                                            Math.cos((lat * Math.PI) / 180),
                                                            {
                                                                $cos: {
                                                                    $subtract: [{ $degreesToRadians: '$oLocation.nLongitude' }, (lng * Math.PI) / 180],
                                                                },
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                                1,
                            ],
                        },
                        radius_km,
                    ],
                },
            })
                .populate('iOrganizerId', 'sUserName sEmail sProfilePic')
                .sort({ dEventDate: 1 })
                .lean();

            // Get RSVP counts for found events
            const eventIds = events.map((e: any) => e._id);
            let rsvpMap = new Map();
            if (eventIds.length > 0) {
                const rsvpCounts = await RSVP.aggregate([{ $match: { iEventId: { $in: eventIds }, eStatus: 'going' } }, { $group: { _id: '$iEventId', count: { $sum: 1 } } }]);
                rsvpMap = new Map(rsvpCounts.map((r: any) => [r._id.toString(), r.count]));
            }

            const result = {
                events: events.map((event: any) => ({
                    ...event,
                    nAttendeeCount: rsvpMap.get(event._id.toString()) || 0,
                })),
            };

            // Cache for 5 minutes
            await redis.setJson(cacheKey, result, 300);

            return res.reply(message.successCM('Events fetched'), result);
        } catch (error) {
            console.error('[discovery] :: controllers.getNearbyEvents :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    // GET /events/trending - Trending events (last 7 days)
    async getTrendingEvents(req: Request, res: Response) {
        try {
            const cacheKey = 'trending_events';
            const cached = await redis.getJson(cacheKey);
            if (cached) {
                return res.reply(message.successCM('Events fetched'), cached);
            }

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Find most viewed event IDs in last 7 days
            const trendingEventIds = await EventView.aggregate([
                { $match: { dCreatedDate: { $gte: sevenDaysAgo } } },
                { $group: { _id: '$iEventId', viewCount: { $sum: 1 } } },
                { $sort: { viewCount: -1 } },
                { $limit: 20 },
            ]);

            const eventIds = trendingEventIds.map((e: any) => new mongoose.Types.ObjectId(e._id));

            const events = await Event.find({
                _id: { $in: eventIds },
                eStatus: 'active',
                dEventDate: { $gte: new Date() },
            })
                .populate('iOrganizerId', 'sUserName sEmail sProfilePic')
                .lean();

            // Get RSVP counts
            let rsvpMap = new Map();
            if (eventIds.length > 0) {
                const rsvpCounts = await RSVP.aggregate([{ $match: { iEventId: { $in: eventIds }, eStatus: 'going' } }, { $group: { _id: '$iEventId', count: { $sum: 1 } } }]);
                rsvpMap = new Map(rsvpCounts.map((r: any) => [r._id.toString(), r.count]));
            }

            const result = {
                events: events.map((event: any) => ({
                    ...event,
                    nAttendeeCount: rsvpMap.get(event._id.toString()) || 0,
                })),
            };

            // Cache for 1 hour
            await redis.setJson(cacheKey, result, 3600);

            return res.reply(message.successCM('Events fetched'), result);
        } catch (error) {
            console.error('[discovery] :: controllers.getTrendingEvents :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }
}

export default new DiscoveryController();
