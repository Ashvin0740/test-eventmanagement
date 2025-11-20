import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface RegisterPageProps {
    setIsAuthenticated: (value: boolean) => void;
}

export default function RegisterPage({ setIsAuthenticated }: RegisterPageProps) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        sEmail: '',
        sPassword: '',
        sUserName: '',
        oLocation: { nLatitude: '', nLongitude: '' },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                oLocation: {
                    nLatitude: parseFloat(formData.oLocation.nLatitude) || undefined,
                    nLongitude: parseFloat(formData.oLocation.nLongitude) || undefined,
                },
            };
            const response = await api.post('/auth/register', payload);
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            setIsAuthenticated(true);
            navigate('/dashboard');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
                    <div className="space-y-4">
                        <input
                            type="text"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Username"
                            value={formData.sUserName}
                            onChange={e => setFormData({ ...formData, sUserName: e.target.value })}
                        />
                        <input
                            type="email"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Email address"
                            value={formData.sEmail}
                            onChange={e => setFormData({ ...formData, sEmail: e.target.value })}
                        />
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Password (min 6 characters)"
                            value={formData.sPassword}
                            onChange={e => setFormData({ ...formData, sPassword: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                step="any"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Latitude (optional)"
                                value={formData.oLocation.nLatitude}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        oLocation: { ...formData.oLocation, nLatitude: e.target.value },
                                    })
                                }
                            />
                            <input
                                type="number"
                                step="any"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Longitude (optional)"
                                value={formData.oLocation.nLongitude}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        oLocation: { ...formData.oLocation, nLongitude: e.target.value },
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link to="/login" className="text-blue-600 hover:text-blue-800">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
