import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Event {
    _id: string;
    sTitle: string;
    sDescription: string;
    oLocation: {
        sAddress?: string;
        sCity?: string;
        nLatitude: number;
        nLongitude: number;
    };
    dEventDate: string;
    sCategory: string;
    nAttendeeCount: number;
    oWeather?: {
        temperature: number;
        description: string;
        icon: string;
    };
}

export default function HomePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLocation, setSearchLocation] = useState({ lat: '', lng: '' });
    const [radius, setRadius] = useState(10);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchNearby = async () => {
        if (!searchLocation.lat || !searchLocation.lng) {
            alert('Please enter latitude and longitude');
            return;
        }
        try {
            setLoading(true);
            const response = await api.get('/discovery/nearby', {
                params: {
                    lat: parseFloat(searchLocation.lat),
                    lng: parseFloat(searchLocation.lng),
                    radius_km: radius,
                },
            });
            setEvents(response.data.data.events || []);
        } catch (error) {
            console.error('Error searching nearby events:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="px-4 py-8 mx-auto max-w-7xl">
                <div className="text-center">Loading events...</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 mx-auto max-w-7xl">
            <h1 className="mb-6 text-3xl font-bold">Discover Events</h1>

            {/* Search Nearby Events */}
            <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-xl font-semibold">Search Nearby Events</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <input
                        type="number"
                        placeholder="Latitude"
                        value={searchLocation.lat}
                        onChange={e => setSearchLocation({ ...searchLocation, lat: e.target.value })}
                        className="px-4 py-2 border rounded"
                        step="any"
                    />
                    <input
                        type="number"
                        placeholder="Longitude"
                        value={searchLocation.lng}
                        onChange={e => setSearchLocation({ ...searchLocation, lng: e.target.value })}
                        className="px-4 py-2 border rounded"
                        step="any"
                    />
                    <div className="flex items-center space-x-2">
                        <label>Radius (km):</label>
                        <input type="range" min="1" max="50" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="flex-1" />
                        <span>{radius} km</span>
                    </div>
                    <button onClick={searchNearby} className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
                        Search
                    </button>
                </div>
            </div>

            {/* Events List */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map(event => (
                    <Link key={event._id} to={`/events/${event._id}`} className="overflow-hidden transition bg-white rounded-lg shadow-md hover:shadow-lg">
                        <div className="p-6">
                            <h3 className="mb-2 text-xl font-semibold">{event.sTitle}</h3>
                            <p className="mb-4 text-gray-600 line-clamp-2">{event.sDescription}</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-gray-500">
                                    <span className="font-medium">Date:</span>
                                    <span className="ml-2">{new Date(event.dEventDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <span className="font-medium">Location:</span>
                                    <span className="ml-2">{event.oLocation.sCity || event.oLocation.sAddress || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <span className="font-medium">Attendees:</span>
                                    <span className="ml-2">{event.nAttendeeCount || 0}</span>
                                </div>
                                {event.oWeather && (
                                    <div className="flex items-center text-gray-500">
                                        <span className="font-medium">Weather:</span>
                                        <span className="ml-2">
                                            {event.oWeather.temperature}°C, {event.oWeather.description}
                                        </span>
                                    </div>
                                )}
                                <div className="inline-block px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">{event.sCategory}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {events.length === 0 && <div className="py-12 text-center text-gray-500">No events found</div>}
        </div>
    );
}
