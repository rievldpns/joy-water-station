import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Phone, User, Package, CheckCircle, AlertCircle, Navigation, Activity } from 'lucide-react';
import Sidebar from './Sidebar.js';
import Header from './Header.js';

const DeliveryMonitoring = () => {
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DEL-001',
      customerName: 'Juan Dela Cruz',
      address: '123 Sampaguita St., Poblacion, Davao City',
      phone: '+63 912 345 6789',
      items: [
        { name: 'Full Water Gallon', quantity: 3 },
        { name: 'Empty Water Gallon', quantity: 2 }
      ],
      scheduledTime: '10:00 AM',
      status: 'pending',
      priority: 'high',
      distance: '2.5 km',
      estimatedTime: '15 min',
      currentLocation: { lat: 7.0731, lng: 125.6128 },
      destination: { lat: 7.0644, lng: 125.6080 },
      lastUpdate: new Date()
    },
    {
      id: 'DEL-002',
      customerName: 'Maria Santos',
      address: '456 Mango Ave., Buhangin, Davao City',
      phone: '+63 923 456 7890',
      items: [
        { name: 'Refilled Water Gallon', quantity: 5 }
      ],
      scheduledTime: '11:30 AM',
      status: 'in-progress',
      priority: 'medium',
      distance: '4.2 km',
      estimatedTime: '8 min',
      currentLocation: { lat: 7.0731, lng: 125.6128 },
      destination: { lat: 7.0900, lng: 125.6250 },
      progress: 65,
      lastUpdate: new Date()
    },
    {
      id: 'DEL-003',
      customerName: 'Pedro Reyes',
      address: '789 Orchid Lane, Matina, Davao City',
      phone: '+63 934 567 8901',
      items: [
        { name: 'Full Water Gallon', quantity: 2 },
        { name: 'Lids', quantity: 1 }
      ],
      scheduledTime: '01:00 PM',
      status: 'pending',
      priority: 'low',
      distance: '6.8 km',
      estimatedTime: '20 min',
      currentLocation: { lat: 7.0731, lng: 125.6128 },
      destination: { lat: 7.0567, lng: 125.6110 },
      lastUpdate: new Date()
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Simulate real-time location updates for in-progress deliveries
  useEffect(() => {
    const locationUpdateInterval = setInterval(() => {
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => {
          if (delivery.status === 'in-progress') {
            // Simulate GPS movement towards destination
            const progress = (delivery.progress || 0) + Math.random() * 5;
            const newProgress = Math.min(progress, 100);
            
            // Update estimated time based on progress
            const remainingTime = Math.max(1, Math.floor((100 - newProgress) / 10));
            
            return {
              ...delivery,
              progress: newProgress,
              estimatedTime: `${remainingTime} min`,
              lastUpdate: new Date(),
              // Simulate GPS coordinates moving
              currentLocation: {
                lat: delivery.currentLocation.lat + (Math.random() - 0.5) * 0.001,
                lng: delivery.currentLocation.lng + (Math.random() - 0.5) * 0.001
              }
            };
          }
          return delivery;
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(locationUpdateInterval);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const updateDeliveryStatus = (id, newStatus) => {
    setDeliveries(deliveries.map(delivery => {
      if (delivery.id === id) {
        if (newStatus === 'in-progress') {
          return { ...delivery, status: newStatus, progress: 0 };
        }
        return { ...delivery, status: newStatus };
      }
      return delivery;
    }));
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter === 'all') return true;
    return delivery.status === filter;
  });

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    inProgress: deliveries.filter(d => d.status === 'in-progress').length,
    completed: deliveries.filter(d => d.status === 'completed').length
  };

  const getTimeSinceUpdate = (lastUpdate) => {
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Live Delivery Monitoring</h1>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Real-time GPS Tracking Active
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Current Time</p>
              <p className="text-lg font-semibold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-1">Total Deliveries</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-1">In Transit</p>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-2 flex gap-2">
          {['all', 'pending', 'in-progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Delivery Cards */}
        <div className="space-y-4">
          {filteredDeliveries.map(delivery => (
            <div key={delivery.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{delivery.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                        {delivery.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <AlertCircle className={`w-5 h-5 ${getPriorityColor(delivery.priority)}`} />
                      {delivery.status === 'in-progress' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                          Live Tracking
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Scheduled Time</p>
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <Clock className="w-4 h-4" />
                      {delivery.scheduledTime}
                    </div>
                  </div>
                </div>

                {/* Live Tracking Info - Only for in-progress deliveries */}
                {delivery.status === 'in-progress' && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Delivery in Progress</span>
                      </div>
                      <span className="text-sm text-blue-700">
                        ETA: {delivery.estimatedTime}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-blue-700 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(delivery.progress || 0)}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${delivery.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* GPS Coordinates */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-blue-600 mb-1">Current Location</p>
                        <p className="font-mono text-blue-900">
                          {delivery.currentLocation.lat.toFixed(4)}, {delivery.currentLocation.lng.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 mb-1">Last Updated</p>
                        <p className="text-blue-900 font-medium">
                          {getTimeSinceUpdate(delivery.lastUpdate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <div className="flex items-start gap-2 mb-3">
                      <User className="w-5 h-5 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-semibold text-gray-800">{delivery.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-800">{delivery.address}</p>
                        <p className="text-sm text-blue-600 mt-1">{delivery.distance} away</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-5 h-5 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="text-gray-800">{delivery.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-2">
                      <Package className="w-5 h-5 text-gray-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-2">Items to Deliver</p>
                        <div className="space-y-2">
                          {delivery.items.map((item, idx) => (
                            <div key={idx} className="bg-gray-50 rounded p-2 flex justify-between items-center">
                              <span className="text-gray-800">{item.name}</span>
                              <span className="font-semibold text-blue-600">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {delivery.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'in-progress')}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Start Delivery & Track
                      </button>
                      <button 
                        onClick={() => setSelectedDelivery(delivery)}
                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        View Route
                      </button>
                    </>
                  )}
                  {delivery.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'completed')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Completed
                      </button>
                      <button 
                        onClick={() => setSelectedDelivery(delivery)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Live Map
                      </button>
                    </>
                  )}
                  {delivery.status === 'completed' && (
                    <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg py-2 px-4 flex items-center justify-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Delivery Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Deliveries Found</h3>
            <p className="text-gray-500">There are no {filter !== 'all' ? filter : ''} deliveries at the moment.</p>
          </div>
        )}
      </div>

      {/* Live Map Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Live GPS Tracking</h2>
                <p className="text-blue-100">{selectedDelivery.id} - {selectedDelivery.customerName}</p>
              </div>
              <button 
                onClick={() => setSelectedDelivery(null)}
                className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Simulated Map View */}
              <div className="bg-gray-200 rounded-lg h-96 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="w-16 h-16 text-blue-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-gray-600 font-semibold">Live GPS Tracking Active</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Current: {selectedDelivery.currentLocation.lat.toFixed(4)}, {selectedDelivery.currentLocation.lng.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Destination: {selectedDelivery.destination.lat.toFixed(4)}, {selectedDelivery.destination.lng.toFixed(4)}
                    </p>
                    <div className="mt-4 text-lg font-semibold text-blue-600">
                      ETA: {selectedDelivery.estimatedTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Distance Remaining</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedDelivery.distance}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Estimated Time</p>
                  <p className="text-2xl font-bold text-green-900">{selectedDelivery.estimatedTime}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                * In production, integrate with Google Maps API or Mapbox for real map display
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMonitoring;