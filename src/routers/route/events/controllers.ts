import { Request, Response } from 'express';
import Event from '../../../models/Event.js';
import RSVP from '../../../models/RSVP.js';
import EventView from '../../../models/EventView.js';
import User from '../../../models/User.js';
import redis from '../../../config/redis.js';
import openweathermapService from '../../../services/openweathermap.js';
import sendgridService from '../../../services/sendgrid.js';
import mongoose from 'mongoose';

class EventController {
    async listEvents(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;
            const category = req.query.category as string;
            const status = (req.query.status as string) || 'active';

            const query: Record<string, any> = { eStatus: status };
            if (category) query.sCategory = category;

            const events = await Event.find(query).populate('iOrganizerId', 'sUserName sEmail sProfilePic').sort({ dCreatedDate: -1 }).skip(skip).limit(limit).lean();

            // Get RSVP counts for each event
            const eventIds = events.map((e: any) => e._id);
            const rsvpCounts = await RSVP.aggregate([{ $match: { iEventId: { $in: eventIds }, eStatus: 'going' } }, { $group: { _id: '$iEventId', count: { $sum: 1 } } }]);

            const rsvpMap = new Map(rsvpCounts.map((r: any) => [r._id.toString(), r.count]));

            const eventsWithCounts = events.map((event: any) => ({
                ...event,
                nAttendeeCount: rsvpMap.get(event._id.toString()) || 0,
            }));

            const total = await Event.countDocuments(query);

            return res.reply(message.successCM('Events fetched'), {
                events: eventsWithCounts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('[events] :: controllers.listEvents :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    async getEventDetails(req: Request, res: Response) {
        try {
            const eventId = req.params.iEventId;
            if (!eventId) return res.reply(message.badRequestCM('Event ID is required'));

            const event = await Event.findById(eventId).populate('iOrganizerId', 'sUserName sEmail sProfilePic').lean();
            if (!event) return res.reply(message.notFoundCM('Event not found'));

            // Get attendee count
            const attendeeCount = await RSVP.countDocuments({ iEventId: eventId, eStatus: 'going' });

            // Get weather data
            const weather = await openweathermapService.getWeather((event as any).oLocation.nLatitude, (event as any).oLocation.nLongitude);

            // Track view (if user is authenticated)
            const userId = req.oData?.user?._id;
            if (eventId) {
                EventView.create({
                    iEventId: eventId,
                    iUserId: userId || undefined,
                    sRemoteAddress: req.sRemoteAddress,
                    sUserAgent: req.headers['user-agent'],
                }).catch(err => console.error('[events] Failed to track view:', err));
            }

            // Get user's RSVP status if authenticated
            let userRSVP = null;
            if (userId) {
                userRSVP = await RSVP.findOne({ iUserId: userId, iEventId: eventId }).lean();
            }

            return res.reply(message.successCM('Event fetched'), {
                event: {
                    ...event,
                    nAttendeeCount: attendeeCount,
                    oWeather: weather,
                    oUserRSVP: userRSVP,
                },
            });
        } catch (error) {
            console.error('[events] :: controllers.getEventDetails :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    // POST /events - Create event (authenticated)
    async createEvent(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));

            const body = _.pick(req.body, ['sTitle', 'sDescription', 'oLocation', 'dEventDate', 'sCategory', 'sImageUrl', 'nMaxAttendees']);

            if (!body.sTitle) return res.reply(message.badRequestCM('Title is required'));
            if (!body.sDescription) return res.reply(message.badRequestCM('Description is required'));
            if (!body.oLocation?.nLatitude || !body.oLocation?.nLongitude) {
                return res.reply(message.badRequestCM('Location is required'));
            }
            if (!body.dEventDate) return res.reply(message.badRequestCM('Event date is required'));
            if (!body.sCategory) return res.reply(message.badRequestCM('Category is required'));

            const newEvent = new Event({
                ...body,
                iOrganizerId: user._id,
                eStatus: 'active',
            });

            await newEvent.save();

            return res.reply(message.successCM('Event created'), { event: newEvent });
        } catch (error) {
            console.error('[events] :: controllers.createEvent :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    // PUT /events/:id - Update event (organizer only)
    async updateEvent(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));

            const eventId = req.params.iEventId;
            if (!eventId) return res.reply(message.badRequestCM('Event ID is required'));

            const event = await Event.findById(eventId);
            if (!event) return res.reply(message.notFoundCM('Event not found'));

            // Check if user is the organizer
            if (event.iOrganizerId.toString() !== user._id.toString()) {
                return res.reply(message.forbiddenCM('Only the organizer can update this event'));
            }

            const body = _.pick(req.body, ['sTitle', 'sDescription', 'oLocation', 'dEventDate', 'sCategory', 'sImageUrl', 'nMaxAttendees', 'eStatus']);

            Object.assign(event, body);
            await event.save();

            return res.reply(message.successCM('Event updated'), { event });
        } catch (error) {
            console.error('[events] :: controllers.updateEvent :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    // DELETE /events/:id - Delete event (organizer only)
    async deleteEvent(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));

            const eventId = req.params.iEventId;
            if (!eventId) return res.reply(message.badRequestCM('Event ID is required'));

            const event = await Event.findById(eventId);
            if (!event) return res.reply(message.notFoundCM('Event not found'));

            // Check if user is the organizer
            if (event.iOrganizerId.toString() !== user._id.toString()) {
                return res.reply(message.forbiddenCM('Only the organizer can delete this event'));
            }

            // Soft delete by setting status to cancelled
            event.eStatus = 'deleted';
            await event.save();

            return res.reply(message.successCM('Event deleted'));
        } catch (error) {
            console.error('[events] :: controllers.deleteEvent :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }
}

export default new EventController();
