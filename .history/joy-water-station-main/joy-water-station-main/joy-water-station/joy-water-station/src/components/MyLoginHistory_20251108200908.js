import React, { useState, useEffect } from 'react';
import { Clock, Monitor, MapPin, AlertCircle, CheckCircle, XCircle, Shield } from 'lucide-react';

export default function MyLoginHistory() {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLoginHistory();
  }, []);

  const fetchMyLoginHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/my-login-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data);
      } else {
        console.error('Failed to fetch login history');
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'Active Session';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop Computer';
  };

  const getBrowser = (userAgent) => {
    if (!userAgent) return 'Unknown Browser';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other Browser';
  };

  const successfulLogins = loginHistory.filter(log => log.loginStatus === 'success').length;
  const failedLogins = loginHistory.filter(log => log.loginStatus === 'failed').length;
  const activeSessions = loginHistory.filter(log => !log.logoutTime && log.loginStatus === 'success').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">My Login History</h1>
        <p className="text-gray-600">View your recent login activity and sessions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Successful Logins</p>
              <p className="text-2xl font-bold">{successfulLogins}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed Attempts</p>
              <p className="text-2xl font-bold">{failedLogins}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold">{activeSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      {failedLogins > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Security Notice:</strong> We detected {failedLogins} failed login attempt{failedLogins > 1 ? 's' : ''} on your account. 
                If this wasn't you, please change your password immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login History Timeline */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="text-sm text-gray-600 mt-1">Last 50 login attempts</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading your login history...</p>
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No login history found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {loginHistory.map((log, index) => (
              <div key={log.id} className={`p-6 hover:bg-gray-50 transition ${log.loginStatus === 'failed' ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${log.loginStatus === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {log.loginStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    {/* Login Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${log.loginStatus === 'success' ? 'text-gray-900' : 'text-red-900'}`}>
                          {log.loginStatus === 'success' ? 'Successful Login' : 'Failed Login Attempt'}
                        </h3>
                        {index === 0 && log.loginStatus === 'success' && !log.logoutTime && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Current Session</span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(log.loginTime).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} at {new Date(log.loginTime).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          <span>{getDeviceType(log.userAgent)} • {getBrowser(log.userAgent)}</span>
                        </div>

                        {log.ipAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>IP Address: {log.ipAddress}</span>
                          </div>
                        )}

                        {log.loginStatus === 'failed' && log.failureReason && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>Reason: {log.failureReason}</span>
                          </div>
                        )}

                        {log.loginStatus === 'success' && (
                          <div className="flex items-center gap-4 mt-2">
                            {log.logoutTime ? (
                              <>
                                <span className="text-gray-500">
                                  Logged out: {new Date(log.logoutTime).toLocaleString()}
                                </span>
                                <span className="text-gray-500">
                                  Duration: {formatDuration(log.sessionDuration)}
                                </span>
                              </>
                            ) : (
                              <span className="text-green-600 font-medium">• Active Session</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Tips
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Review your login history regularly for any suspicious activity</li>
          <li>• If you see an unrecognized login, change your password immediately</li>
          <li>• Always log out from shared or public computers</li>
          <li>• Enable two-factor authentication if available</li>
          <li>• Use a strong, unique password for your account</li>
        </ul>
      </div>
    </div>
  );
}