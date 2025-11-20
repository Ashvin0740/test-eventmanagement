import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { profileAPI } from '../services/api';

interface NavbarProps {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
}

export default function Navbar({ isAuthenticated, setIsAuthenticated }: NavbarProps) {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            // Call the logout API endpoint
            await profileAPI.logout();
        } catch (error) {
            console.error('Error during logout:', error);
            // Continue with logout even if API call fails
        } finally {
            // Clear local storage and update state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setIsLoggingOut(false);
            navigate('/');
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link
                            to="/"
                            className="flex items-center space-x-2 text-2xl font-bold text-transparent transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text hover:from-blue-700 hover:to-blue-900"
                        >
                            <span>🎉</span>
                            <span>Event Platform</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-1">
                        <Link to="/" className="px-4 py-2 font-medium text-gray-700 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50">
                            Home
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="px-4 py-2 font-medium text-gray-700 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50"
                                >
                                    Dashboard
                                </Link>
                                <Link to="/profile" className="px-4 py-2 font-medium text-gray-700 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50">
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="flex items-center px-4 py-2 ml-2 space-x-1 font-medium text-white transition-all duration-200 bg-red-500 rounded-md shadow-sm hover:bg-red-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            <span>Logging out...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Logout</span>
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 font-medium text-gray-700 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50">
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 ml-2 font-medium text-white transition-all duration-200 bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 hover:shadow-md"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
