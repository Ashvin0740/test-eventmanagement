import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

interface UserProfile {
    _id: string;
    sEmail: string;
    sUserName: string;
    bEmailVerified: boolean;
    oLocation?: {
        nLatitude?: number;
        nLongitude?: number;
        sAddress?: string;
        sCity?: string;
    };
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await profileAPI.getUserProfile();
            setProfile(response.data.data.user);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl px-4 py-8 mx-auto">
                <div className="flex items-center justify-center h-40">
                    <span className="text-lg text-gray-600">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl px-4 py-8 mx-auto">
                <div className="px-4 py-3 text-center text-red-700 border border-red-200 rounded bg-red-50">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl px-4 py-8 mx-auto">
            <h1 className="mb-8 text-3xl font-bold text-left text-gray-900">My Profile</h1>

            <div className="p-8 bg-white border border-gray-100 shadow-lg rounded-2xl">
                <div className="space-y-6">
                    {/* Username */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                        <label className="block mb-1 text-sm font-medium text-gray-500 min-w-[110px]">Username</label>
                        <div className="text-base font-medium text-gray-800 sm:text-lg">{profile?.sUserName || <span className="text-gray-400">N/A</span>}</div>
                    </div>
                    {/* Email */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                        <label className="block mb-1 text-sm font-medium text-gray-500 min-w-[110px]">Email</label>
                        <div className="text-base font-medium text-gray-800 sm:text-lg">{profile?.sEmail || <span className="text-gray-400">N/A</span>}</div>
                    </div>
                    {/* Email Verified */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                        <label className="block mb-1 text-sm font-medium text-gray-500 min-w-[110px]">Email Verified</label>
                        <div className={`text-base sm:text-lg font-semibold ${profile?.bEmailVerified ? 'text-green-600' : 'text-red-500'}`}>
                            {profile?.bEmailVerified ? 'Yes' : 'No'}
                        </div>
                    </div>
                    {/* Location */}
                    {profile?.oLocation && (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4">
                            <label className="block mb-2 text-sm font-medium text-gray-500 min-w-[110px]">Location</label>
                            <div className="space-y-1">
                                {profile.oLocation.sCity && (
                                    <div className="text-base text-gray-800">
                                        <span className="font-medium text-gray-600">City:</span> <span className="ml-1">{profile.oLocation.sCity}</span>
                                    </div>
                                )}
                                {profile.oLocation.sAddress && (
                                    <div className="text-base text-gray-800">
                                        <span className="font-medium text-gray-600">Address:</span> <span className="ml-1">{profile.oLocation.sAddress}</span>
                                    </div>
                                )}
                                {(profile.oLocation.nLatitude !== undefined || profile.oLocation.nLongitude !== undefined) && (
                                    <div className="text-base text-gray-800">
                                        <span className="font-medium text-gray-600">Coordinates:</span>{' '}
                                        <span className="ml-1">
                                            {profile.oLocation.nLatitude !== undefined ? profile.oLocation.nLatitude.toFixed(4) : '--'},{' '}
                                            {profile.oLocation.nLongitude !== undefined ? profile.oLocation.nLongitude.toFixed(4) : '--'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
