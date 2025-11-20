import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { eventsAPI, profileAPI, UpdateEventData } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';

interface Event {
    _id: string;
    sTitle: string;
    sDescription: string;
    oLocation: {
        sAddress?: string;
        sCity?: string;
        sState?: string;
        sCountry?: string;
        nLatitude: number;
        nLongitude: number;
    };
    dEventDate: string;
    sCategory: string;
    nAttendeeCount: number;
    oWeather?: {
        temperature: number;
        description: string;
        humidity: number;
        windSpeed: number;
        icon: string;
        city: string;
    };
    oUserRSVP?: {
        eStatus: string;
    };
    iOrganizerId: {
        _id?: string;
        sUserName: string;
        sEmail: string;
    };
    sImageUrl?: string;
    nMaxAttendees?: number;
    eStatus?: string;
}

export default function EventDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendeeCount, setAttendeeCount] = useState(0);
    const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<UpdateEventData>({});
    const [saving, setSaving] = useState(false);
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            if (isAuthenticated) {
                fetchCurrentUser();
            }
            connectSocket();
            const socket = getSocket();
            if (socket) {
                socket.emit('joinEvent', id);
                socket.on('attendeeCount', (data: { eventId: string; attendeeCount: number }) => {
                    if (data.eventId === id) {
                        setAttendeeCount(data.attendeeCount);
                    }
                });
            }
        }
        return () => {
            const socket = getSocket();
            if (socket && id) {
                socket.emit('leaveEvent', id);
                socket.off('attendeeCount');
            }
        };
    }, [id, isAuthenticated]);

    const fetchEventDetails = async () => {
        try {
            const response = await api.get(`/events/${id}`);
            const eventData = response.data.data.event;
            setEvent(eventData);
            setAttendeeCount(eventData.nAttendeeCount || 0);
            setRsvpStatus(prev => eventData.oUserRSVP?.eStatus || prev || null);
        } catch (error) {
            console.error('Error fetching event details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRsvpStatus = async () => {
        if (!isAuthenticated || !id) return;
        try {
            const response = await api.get('/rsvp/user/events', { params: { type: 'all' } });
            const events = response.data.data.events || [];
            const matchedEvent = events.find((evt: any) => (evt._id || evt.iEventId?._id)?.toString() === id);
            if (matchedEvent?.oRSVP?.eStatus) {
                setRsvpStatus(matchedEvent.oRSVP.eStatus);
            }
        } catch (error) {
            console.error('Error fetching user RSVP status:', error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await profileAPI.getUserProfile();
            setCurrentUserId(response.data.data.user._id);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const isOrganizer = () => {
        if (!event || !currentUserId) return false;
        // Check if current user is the organizer
        // Handle both populated (object with _id) and non-populated (string) cases
        const organizerId = typeof event.iOrganizerId === 'object' && event.iOrganizerId._id ? event.iOrganizerId._id : (event.iOrganizerId as any);
        return organizerId?.toString() === currentUserId.toString();
    };

    const handleEdit = () => {
        if (!event) return;
        setEditFormData({
            sTitle: event.sTitle,
            sDescription: event.sDescription,
            oLocation: event.oLocation,
            dEventDate: new Date(event.dEventDate).toISOString().slice(0, 16),
            sCategory: event.sCategory,
            sImageUrl: event.sImageUrl,
            nMaxAttendees: event.nMaxAttendees,
            eStatus: (event.eStatus as 'active' | 'cancelled') || 'active',
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!id) return;
        try {
            setSaving(true);
            await eventsAPI.updateEvent(id, editFormData);
            setIsEditModalOpen(false);
            fetchEventDetails();
        } catch (error: any) {
            console.error('Error updating event:', error);
            alert(error.response?.data?.message || 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            setSaving(true);
            await eventsAPI.deleteEvent(id);
            setIsDeleteConfirmOpen(false);
            navigate('/');
        } catch (error: any) {
            console.error('Error deleting event:', error);
            alert(error.response?.data?.message || 'Failed to delete event');
        } finally {
            setSaving(false);
        }
    };

    const handleRSVP = async (status: string) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await api.post(`/rsvp/events/${id}`, { status });
            setRsvpStatus(status);
            fetchEventDetails();
            fetchUserRsvpStatus();
        } catch (error) {
            console.error('Error RSVPing:', error);
            alert('Failed to RSVP');
        }
    };

    const handleCancelRSVP = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await api.delete(`/rsvp/events/${id}`);
            setRsvpStatus(null);
            fetchEventDetails();
            fetchUserRsvpStatus();
        } catch (error) {
            console.error('Error canceling RSVP:', error);
            alert('Failed to cancel RSVP');
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserRsvpStatus();
        }
    }, [isAuthenticated, id]);

    if (loading) {
        return (
            <div className="max-w-4xl px-4 py-8 mx-auto">
                <div className="text-center">Loading event details...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-4xl px-4 py-8 mx-auto">
                <div className="text-center text-red-500">Event not found</div>
            </div>
        );
    }

    const isEventOrganizer = isOrganizer();

    return (
        <div className="max-w-4xl px-4 py-8 mx-auto">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800">
                    ← Back
                </button>
                {isEventOrganizer && (
                    <div className="space-x-2">
                        <button onClick={handleEdit} className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
                            Edit Event
                        </button>
                        <button onClick={() => setIsDeleteConfirmOpen(true)} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600">
                            Delete Event
                        </button>
                    </div>
                )}
            </div>

            <div className="p-8 bg-white rounded-lg shadow-md">
                <h1 className="mb-4 text-3xl font-bold">{event.sTitle}</h1>
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 text-blue-800 bg-blue-100 rounded">{event.sCategory}</span>
                </div>

                <p className="mb-6 text-gray-700">{event.sDescription}</p>

                <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                    <div>
                        <h3 className="mb-2 font-semibold">Event Details</h3>
                        <div className="space-y-2 text-gray-600">
                            <div>
                                <span className="font-medium">Date:</span> {new Date(event.dEventDate).toLocaleString()}
                            </div>
                            <div>
                                <span className="font-medium">Location:</span> {event.oLocation.sAddress || event.oLocation.sCity || 'N/A'}
                            </div>
                            <div>
                                <span className="font-medium">Organizer:</span> {event.iOrganizerId?.sUserName}
                            </div>
                            <div>
                                <span className="font-medium">Attendees:</span> {attendeeCount}
                            </div>
                        </div>
                    </div>

                    {event.oWeather && (
                        <div>
                            <h3 className="mb-2 font-semibold">Weather</h3>
                            <div className="space-y-2 text-gray-600">
                                <div>
                                    <span className="font-medium">Temperature:</span> {event.oWeather.temperature}°C
                                </div>
                                <div>
                                    <span className="font-medium">Condition:</span> {event.oWeather.description}
                                </div>
                                <div>
                                    <span className="font-medium">Humidity:</span> {event.oWeather.humidity}%
                                </div>
                                <div>
                                    <span className="font-medium">Wind Speed:</span> {event.oWeather.windSpeed} m/s
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t">
                    <h3 className="mb-4 font-semibold">RSVP</h3>
                    {rsvpStatus ? (
                        <div className="space-y-2">
                            <p className="text-green-600">You are {rsvpStatus} this event</p>
                            <button onClick={handleCancelRSVP} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600">
                                Cancel RSVP
                            </button>
                        </div>
                    ) : (
                        <div className="space-x-2">
                            <button onClick={() => handleRSVP('going')} className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600">
                                Going
                            </button>
                            <button onClick={() => handleRSVP('interested')} className="px-4 py-2 text-white bg-yellow-500 rounded hover:bg-yellow-600">
                                Interested
                            </button>
                            {!isAuthenticated && <p className="mt-2 text-sm text-gray-500">Login to RSVP</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="mb-4 text-2xl font-bold">Edit Event</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Title</label>
                                <input
                                    type="text"
                                    value={editFormData.sTitle || ''}
                                    onChange={e => setEditFormData({ ...editFormData, sTitle: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Description</label>
                                <textarea
                                    value={editFormData.sDescription || ''}
                                    onChange={e => setEditFormData({ ...editFormData, sDescription: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={editFormData.dEventDate || ''}
                                        onChange={e => setEditFormData({ ...editFormData, dEventDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Category</label>
                                    <input
                                        type="text"
                                        value={editFormData.sCategory || ''}
                                        onChange={e => setEditFormData({ ...editFormData, sCategory: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Address</label>
                                <input
                                    type="text"
                                    value={editFormData.oLocation?.sAddress || ''}
                                    onChange={e =>
                                        setEditFormData({
                                            ...editFormData,
                                            oLocation: {
                                                ...editFormData.oLocation,
                                                sAddress: e.target.value,
                                                nLatitude: editFormData.oLocation?.nLatitude || 0,
                                                nLongitude: editFormData.oLocation?.nLongitude || 0,
                                            },
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={editFormData.oLocation?.nLatitude || ''}
                                        onChange={e =>
                                            setEditFormData({
                                                ...editFormData,
                                                oLocation: {
                                                    ...editFormData.oLocation,
                                                    nLatitude: parseFloat(e.target.value) || 0,
                                                    nLongitude: editFormData.oLocation?.nLongitude || 0,
                                                },
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={editFormData.oLocation?.nLongitude || ''}
                                        onChange={e =>
                                            setEditFormData({
                                                ...editFormData,
                                                oLocation: {
                                                    ...editFormData.oLocation,
                                                    nLatitude: editFormData.oLocation?.nLatitude || 0,
                                                    nLongitude: parseFloat(e.target.value) || 0,
                                                },
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Image URL (optional)</label>
                                <input
                                    type="url"
                                    value={editFormData.sImageUrl || ''}
                                    onChange={e => setEditFormData({ ...editFormData, sImageUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Max Attendees (optional)</label>
                                <input
                                    type="number"
                                    value={editFormData.nMaxAttendees || ''}
                                    onChange={e => setEditFormData({ ...editFormData, nMaxAttendees: parseInt(e.target.value) || undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Status</label>
                                <select
                                    value={editFormData.eStatus || 'active'}
                                    onChange={e => setEditFormData({ ...editFormData, eStatus: e.target.value as 'active' | 'cancelled' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                >
                                    <option value="active">Active</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300" disabled={saving}>
                                Cancel
                            </button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                        <h2 className="mb-4 text-2xl font-bold text-red-600">Delete Event</h2>
                        <p className="mb-6 text-gray-700">Are you sure you want to delete this event? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300" disabled={saving}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600" disabled={saving}>
                                {saving ? 'Deleting...' : 'Delete Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
