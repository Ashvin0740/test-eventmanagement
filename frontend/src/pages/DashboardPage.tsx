import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Event {
    _id: string;
    sTitle: string;
    sDescription: string;
    dEventDate: string;
    sCategory: string;
    nAttendeeCount: number;
    sType: 'created' | 'attending' | 'interested';
}

export default function DashboardPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'created' | 'attending' | 'interested'>('all');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        sTitle: '',
        sDescription: '',
        dEventDate: '',
        sCategory: '',
        oLocation: { nLatitude: '', nLongitude: '', sAddress: '', sCity: '' },
    });

    useEffect(() => {
        fetchUserEvents();
    }, [filter]);

    const fetchUserEvents = async () => {
        try {
            const response = await api.get('/rsvp/user/events', {
                params: { type: filter },
            });
            setEvents(response.data.data.events || []);
        } catch (error) {
            console.error('Error fetching user events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...createForm,
                dEventDate: new Date(createForm.dEventDate).toISOString(),
                oLocation: {
                    ...createForm.oLocation,
                    nLatitude: parseFloat(createForm.oLocation.nLatitude),
                    nLongitude: parseFloat(createForm.oLocation.nLongitude),
                },
            };
            await api.post('/events', payload);
            setShowCreateForm(false);
            setCreateForm({
                sTitle: '',
                sDescription: '',
                dEventDate: '',
                sCategory: '',
                oLocation: { nLatitude: '', nLongitude: '', sAddress: '', sCity: '' },
            });
            fetchUserEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event');
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Dashboard</h1>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    {showCreateForm ? 'Cancel' : 'Create Event'}
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-4 mb-6 border-b">
                {(['all', 'created', 'attending', 'interested'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 capitalize ${filter === type ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Create Event Form */}
            {showCreateForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                        <input
                            type="text"
                            required
                            placeholder="Event Title"
                            className="w-full border rounded px-4 py-2"
                            value={createForm.sTitle}
                            onChange={e => setCreateForm({ ...createForm, sTitle: e.target.value })}
                        />
                        <textarea
                            required
                            placeholder="Description"
                            className="w-full border rounded px-4 py-2"
                            rows={3}
                            value={createForm.sDescription}
                            onChange={e => setCreateForm({ ...createForm, sDescription: e.target.value })}
                        />
                        <input
                            type="datetime-local"
                            required
                            className="w-full border rounded px-4 py-2"
                            value={createForm.dEventDate}
                            onChange={e => setCreateForm({ ...createForm, dEventDate: e.target.value })}
                        />
                        <input
                            type="text"
                            required
                            placeholder="Category"
                            className="w-full border rounded px-4 py-2"
                            value={createForm.sCategory}
                            onChange={e => setCreateForm({ ...createForm, sCategory: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                step="any"
                                required
                                placeholder="Latitude"
                                className="border rounded px-4 py-2"
                                value={createForm.oLocation.nLatitude}
                                onChange={e =>
                                    setCreateForm({
                                        ...createForm,
                                        oLocation: { ...createForm.oLocation, nLatitude: e.target.value },
                                    })
                                }
                            />
                            <input
                                type="number"
                                step="any"
                                required
                                placeholder="Longitude"
                                className="border rounded px-4 py-2"
                                value={createForm.oLocation.nLongitude}
                                onChange={e =>
                                    setCreateForm({
                                        ...createForm,
                                        oLocation: { ...createForm.oLocation, nLongitude: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Address (optional)"
                            className="w-full border rounded px-4 py-2"
                            value={createForm.oLocation.sAddress}
                            onChange={e =>
                                setCreateForm({
                                    ...createForm,
                                    oLocation: { ...createForm.oLocation, sAddress: e.target.value },
                                })
                            }
                        />
                        <input
                            type="text"
                            placeholder="City (optional)"
                            className="w-full border rounded px-4 py-2"
                            value={createForm.oLocation.sCity}
                            onChange={e =>
                                setCreateForm({
                                    ...createForm,
                                    oLocation: { ...createForm.oLocation, sCity: e.target.value },
                                })
                            }
                        />
                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                            Create Event
                        </button>
                    </form>
                </div>
            )}

            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <Link key={event._id} to={`/events/${event._id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-semibold">{event.sTitle}</h3>
                                <span
                                    className={`px-2 py-1 rounded text-xs ${
                                        event.sType === 'created'
                                            ? 'bg-purple-100 text-purple-800'
                                            : event.sType === 'attending'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
                                    {event.sType}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{event.sDescription}</p>
                            <div className="space-y-2 text-sm text-gray-500">
                                <div>
                                    <span className="font-medium">Date:</span> {new Date(event.dEventDate).toLocaleDateString()}
                                </div>
                                <div>
                                    <span className="font-medium">Category:</span> {event.sCategory}
                                </div>
                                <div>
                                    <span className="font-medium">Attendees:</span> {event.nAttendeeCount || 0}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {events.length === 0 && <div className="text-center py-12 text-gray-500">No events found</div>}
        </div>
    );
}
