import React, { useState, useEffect } from 'react';
import { 
  X, 
  Home, 
  Users,
  BookUser,
  Package, 
  Warehouse, 
  BarChart3, 
  FileText, 
  Truck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Shield,
  Activity,
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentView, setCurrentView, currentUser, handleLogout, products = [], customers = [] }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);

  // animation states
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [sidebarOpen]);

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculate dynamic notifications based on data
  useEffect(() => {
    const lowStockItems = products.filter(item => item.currentStock <= item.minStock).length;
    const pendingDeliveries = 0; // Could be calculated from deliveries prop if passed
    setNotifications(lowStockItems + pendingDeliveries);
  }, [products]);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      color: 'blue',
      description: 'Overview and analytics'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      color: 'indigo',
      adminOnly: true,
      description: 'Manage system users'
    },
    {
      id: 'customers',
      label: 'Customer Management',
      icon: BookUser,
      color: 'pink',
      description: 'Manage customer records'
    },
    {
      id: 'items',
      label: 'Item Management',
      icon: Package,
      color: 'green',
      description: 'Water products catalog'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Warehouse,
      color: 'yellow',
      description: 'Stock levels and tracking'
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: BarChart3,
      color: 'purple',
      description: 'Revenue and performance'
    },
    {
      id: 'delivery-monitoring',
      label: 'Delivery Monitoring',
      icon: Truck,
      color: 'orange',
      badge: notifications,
      description: 'Track deliveries and logistics'
    }
  ];



  const getColorClasses = (color, isActive = false) => {
    const colors = {
      blue: {
        bg: isActive ? 'bg-blue-100' : 'hover:bg-blue-50',
        text: isActive ? 'text-blue-700' : 'text-gray-700 hover:text-blue-600',
        border: 'border-blue-500',
        icon: isActive ? 'text-blue-600' : 'text-gray-500'
      },
      indigo: {
        bg: isActive ? 'bg-indigo-100' : 'hover:bg-indigo-50',
        text: isActive ? 'text-indigo-700' : 'text-gray-700 hover:text-indigo-600',
        border: 'border-indigo-500',
        icon: isActive ? 'text-indigo-600' : 'text-gray-500'
      },
      green: {
        bg: isActive ? 'bg-green-100' : 'hover:bg-green-50',
        text: isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-600',
        border: 'border-green-500',
        icon: isActive ? 'text-green-600' : 'text-gray-500'
      },
      yellow: {
        bg: isActive ? 'bg-yellow-100' : 'hover:bg-yellow-50',
        text: isActive ? 'text-yellow-700' : 'text-gray-700 hover:text-yellow-600',
        border: 'border-yellow-500',
        icon: isActive ? 'text-yellow-600' : 'text-gray-500'
      },
      purple: {
        bg: isActive ? 'bg-purple-100' : 'hover:bg-purple-50',
        text: isActive ? 'text-purple-700' : 'text-gray-700 hover:text-purple-600',
        border: 'border-purple-500',
        icon: isActive ? 'text-purple-600' : 'text-gray-500'
      },
      orange: {
        bg: isActive ? 'bg-orange-100' : 'hover:bg-orange-50',
        text: isActive ? 'text-orange-700' : 'text-gray-700 hover:text-orange-600',
        border: 'border-orange-500',
        icon: isActive ? 'text-orange-600' : 'text-gray-500'
      },
      teal: {
        bg: isActive ? 'bg-teal-100' : 'hover:bg-teal-50',
        text: isActive ? 'text-teal-700' : 'text-gray-700 hover:text-teal-600',
        border: 'border-teal-500',
        icon: isActive ? 'text-teal-600' : 'text-gray-500'
      },
      pink: {
        bg: isActive ? 'bg-pink-100' : 'hover:bg-pink-50',
        text: isActive ? 'text-pink-700' : 'text-gray-700 hover:text-pink-600',
        border: 'border-pink-500',
        icon: isActive ? 'text-pink-600' : 'text-gray-500'
      }
    };
    return colors[color] || colors.blue;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Administrator':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'Manager':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <>
      {/* sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${
          isCollapsed ? 'w-20' : 'w-80'
        } bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-gray-200`}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* sidebar header */}
          <div 
            className="flex items-center justify-between h-20 px-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)'
            }}
          >
            {/* water wave effect */}
            <div 
              className="absolute bottom-0 left-0 w-full h-2 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                animation: 'wave 3s ease-in-out infinite'
              }}
            />
            
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl -ml-4 backdrop-blur-sm border border-white border-opacity-30">
                <span className="text-white font-bold text-xl">💧</span>
              </div>
              {!isCollapsed && (
                <div className="text-white ml-6">
                  <h2 className="text-xl font-bold">Joy Water Station</h2>
                  <p className="text-sm text-blue-100 opacity-90">Management System</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center w-8 h-8 ml-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden flex items-center justify-center w-8 h-8 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              if (item.adminOnly && currentUser?.role !== 'Administrator') return null;
              
              const isActive = currentView === item.id;
              const colors = getColorClasses(item.color, isActive);
              const Icon = item.icon;

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      setCurrentView(item.id);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    disabled={item.id === 'delivery' && notifications === 0}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-300 transform ${
                      colors.bg
                    } ${colors.text} ${
                      isActive
                        ? `border-r-4 ${colors.border} shadow-lg scale-105`
                        : 'hover:scale-102 hover:shadow-md'
                    } group relative overflow-hidden ${item.id === 'delivery' && notifications === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* animated background */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${
                      isActive ? 'from-blue-50 to-transparent opacity-100' : 'from-gray-50 to-transparent opacity-0 group-hover:opacity-50'
                    } transition-opacity duration-300`} />
                    
                    <div className="relative z-10 flex items-center w-full">
                      <div className={`flex-shrink-0 ${colors.icon} transition-colors duration-200`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      {!isCollapsed && (
                        <>
                          <span className="font-semibold ml-4 flex-1">{item.label}</span>
                          
                          {/* Badge */}
                          {item.badge && (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                              {item.badge}
                            </div>
                          )}
                          
                          {/* notification dot */}
                          {item.id === 'delivery' && notifications > 0 && !item.badge && (
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                          )}
                        </>
                      )}
                    </div>
                  </button>

                  {/* collapsed  */}
                  {isCollapsed && hoveredItem === item.id && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-300">{item.description}</div>
                      {/* arrow */}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* quick actions */}
          {!isCollapsed && (
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </button>
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          )}

          {/* sidebar footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 bg-opacity-50">
            {!isCollapsed ? (
              <div className="space-y-3">
                {/* user info */}
                <div className="flex items-center px-4 py-3 bg-white bg-opacity-70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl mr-3 shadow-sm">
                    <span className="text-white font-bold text-sm">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {currentUser?.firstName || currentUser?.username}
                      </p>
                      <div className="ml-2">
                        {getRoleIcon(currentUser?.role)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.role}</p>
                  </div>
                </div>
                
                {/* logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-200 font-medium text-sm group"
                >
                  <LogOut className="w-4 h-4 mr-2 group-hover:transform group-hover:translate-x-1 transition-transform duration-200" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes wave {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }

          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
        `
      }} />
    </>
  );
};

export default Sidebar;