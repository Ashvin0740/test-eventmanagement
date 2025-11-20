import { Request, Response } from 'express';
import RSVP from '../../../models/RSVP.js';
import Event from '../../../models/Event.js';
import User from '../../../models/User.js';
import sendgridService from '../../../services/sendgrid.js';
import mongoose from 'mongoose';

class RSVPController {
    // POST /events/:id/rsvp - RSVP to event
    async createRSVP(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));

            const eventId = req.params.iRsvpId;
            const status = req.body.status || 'going'; // going, interested, not-going

            if (!eventId) return res.reply(message.badRequestCM('Event ID is required'));
            if (!['going', 'interested', 'not-going'].includes(status)) {
                return res.reply(message.badRequestCM('Invalid RSVP status'));
            }

            const event = await Event.findById(eventId);
            if (!event) return res.reply(message.notFoundCM('Event not found'));

            // Check if RSVP already exists
            let rsvp = await RSVP.findOne({ iUserId: user._id, iEventId: eventId });
            if (rsvp) {
                rsvp.eStatus = status;
                await rsvp.save();
            } else {
                rsvp = new RSVP({
                    iUserId: user._id,
                    iEventId: eventId,
                    eStatus: status,
                });
                await rsvp.save();
            }

            // Send notification to organizer if user is going
            if (status === 'going') {
                const organizer = await User.findById(event.iOrganizerId);
                if (organizer && organizer.sEmail) {
                    sendgridService.sendRSVPNotificationEmail(organizer.sEmail, organizer.sUserName || 'Organizer', user.sUserName || 'User', event.sTitle).catch(err => {
                        console.error('[rsvp] Failed to send notification email:', err);
                    });
                }
            }

            // Emit real-time attendee count update via Socket.io
            if (global.io) {
                const attendeeCount = await RSVP.countDocuments({ iEventId: eventId, eStatus: 'going' });
                global.io.to(`event:${eventId}`).emit('attendeeCount', { eventId, attendeeCount });
            }

            return res.reply(message.successCM('RSVP created'), { rsvp });
        } catch (error) {
            console.error('[rsvp] :: controllers.createRSVP :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    // DELETE /events/:id/rsvp - Cancel RSVP
    async deleteRSVP(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Authentication required'));

            const eventId = req.params.iRsvpId;
            if (!eventId) return res.reply(message.badRequestCM('Event ID is required'));

            const rsvp = await RSVP.findOneAndDelete({ iUserId: user._id, iEventId: eventId });
            if (!rsvp) return res.reply(message.notFoundCM('RSVP not found'));

            // Emit real-time attendee count update via Socket.io
            if (global.io) {
                const attendeeCount = await RSVP.countDocuments({ iEventId: eventId, eStatus: 'going' });
                global.io.to(`event:${eventId}`).emit('attendeeCount', { eventId, attendeeCount });
            }

            return res.reply(message.successCM('RSVP deleted'));
        } catch (error) {
            console.error('[rsvp] :: controllers.deleteRSVP :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }

    // GET /user/events - User's events (created/attending)
    async getUserEvents(req: Request, res: Response) {
        try {
            const user = req.oData?.user;
            if (!user) return res.reply(message.unauthorizedCM('Unauthorized'));

            const type = (req.query.type as string) || 'all'; // all, created, attending, interested

            let events: any[] = [];

            if (type === 'created' || type === 'all') {
                const createdEvents = await Event.find({ iOrganizerId: user._id }).populate('iOrganizerId', 'sUserName sEmail sProfilePic').sort({ dCreatedDate: -1 }).lean();
                events.push(...createdEvents.map((e: any) => ({ ...e, sType: 'created' })));
            }

            if (type === 'attending' || type === 'interested' || type === 'all') {
                const rsvps = await RSVP.find({
                    iUserId: user._id,
                    eStatus: type === 'attending' ? 'going' : type === 'interested' ? 'interested' : { $in: ['going', 'interested'] },
                })
                    .populate({
                        path: 'iEventId',
                        populate: { path: 'iOrganizerId', select: 'sUserName sEmail sProfilePic' },
                    })
                    .sort({ dCreatedDate: -1 })
                    .lean();

                const rsvpEvents = rsvps
                    .filter((r: any) => r.iEventId)
                    .map((r: any) => ({
                        ...r.iEventId,
                        sType: r.eStatus === 'going' ? 'attending' : 'interested',
                        oRSVP: { eStatus: r.eStatus, dCreatedDate: r.dCreatedDate },
                    }));
                events.push(...rsvpEvents);
            }

            // Remove duplicates and get attendee counts
            const eventIds = [...new Set(events.map((e: any) => e._id.toString()))];
            const rsvpCounts = await RSVP.aggregate([
                { $match: { iEventId: { $in: eventIds.map((id: string) => new mongoose.Types.ObjectId(id)) }, eStatus: 'going' } },
                { $group: { _id: '$iEventId', count: { $sum: 1 } } },
            ]);

            const rsvpMap = new Map(rsvpCounts.map((r: any) => [r._id.toString(), r.count]));

            const eventsWithCounts = events.map((event: any) => ({
                ...event,
                nAttendeeCount: rsvpMap.get(event._id.toString()) || 0,
            }));

            return res.reply(message.successCM('Events fetched'), { events: eventsWithCounts });
        } catch (error) {
            console.error('[rsvp] :: controllers.getUserEvents :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    }
}

export default new RSVPController();
