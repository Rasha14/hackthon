import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { GlassCard } from "./glass-card";
import { MagneticButton } from "./magnetic-button";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, ScatterChart, Scatter } from "recharts";
import { adminAPI } from "../../services/api";

interface AdminDashboardProps {
  onNavigate: (screen: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        if (!isAuthenticated || !isAdmin) {
          setError('Admin access required');
          setIsLoading(false);
          return;
        }

        const [data, users, claims] = await Promise.all([
          adminAPI.getDashboardData(),
          adminAPI.getUsers(),
          adminAPI.getClaims(),
        ]);

        setDashboardData(data);
        setUsersList(users.users || users || []);
        setClaimsList(claims.claims || claims || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refreshAdminData = async () => {
    try {
      setActionLoading(true);
      const [data, users, claims] = await Promise.all([
        adminAPI.getDashboardData(),
        adminAPI.getUsers(),
        adminAPI.getClaims(),
      ]);
      setDashboardData(data);
      setUsersList(users.users || users || []);
      setClaimsList(claims.claims || claims || []);
    } catch (err) {
      console.error('Refresh admin data failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      setActionLoading(true);
      await adminAPI.approveClaim(claimId);
      await refreshAdminData();
    } catch (err) {
      console.error('Approve claim error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      setActionLoading(true);
      await adminAPI.rejectClaim(claimId, 'Rejected by admin');
      await refreshAdminData();
    } catch (err) {
      console.error('Reject claim error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      setActionLoading(true);
      await adminAPI.disableUser(userId);
      await refreshAdminData();
    } catch (err) {
      console.error('Disable user error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      setActionLoading(true);
      await adminAPI.enableUser(userId);
      await refreshAdminData();
    } catch (err) {
      console.error('Enable user error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const statsData = dashboardData ? [
    { label: "Total Reports", value: (dashboardData.totals.lost_items + dashboardData.totals.found_items).toLocaleString(), change: "+12.5%", icon: Package, color: "#0066ff" },
    { label: "Active Users", value: dashboardData.totals.users.toLocaleString(), change: "+8.2%", icon: Users, color: "#06b6d4" },
    { label: "Success Rate", value: `${dashboardData.success_rate}%`, change: "+2.1%", icon: TrendingUp, color: "#14b8a6" },
    { label: "Fraud Blocked", value: dashboardData.fraud_alerts.length.toString(), change: "-15.3%", icon: Shield, color: "#ef4444" },
  ] : [
    { label: "Total Reports", value: "12,847", change: "+12.5%", icon: Package, color: "#0066ff" },
    { label: "Active Users", value: "45,293", change: "+8.2%", icon: Users, color: "#06b6d4" },
    { label: "Success Rate", value: "94.2%", change: "+2.1%", icon: TrendingUp, color: "#14b8a6" },
    { label: "Fraud Blocked", value: "127", change: "-15.3%", icon: Shield, color: "#ef4444" },
  ];

  const chartData = [
    { name: "Jan", reports: 400, recovered: 380 },
    { name: "Feb", reports: 450, recovered: 420 },
    { name: "Mar", reports: 520, recovered: 490 },
    { name: "Apr", reports: 480, recovered: 455 },
    { name: "May", reports: 590, recovered: 560 },
    { name: "Jun", reports: 650, recovered: 615 },
  ];

  const categoryData = [
    { name: "Electronics", value: 450 },
    { name: "Keys", value: 320 },
    { name: "Wallets", value: 280 },
    { name: "Jewelry", value: 180 },
    { name: "Documents", value: 150 },
  ];

  // Sample location data for heatmap (simplified coordinates)
  const locationData = [
    { name: "Times Square", x: 40.7589, y: -73.9851, count: 45, intensity: 0.9 },
    { name: "Central Park", x: 40.7829, y: -73.9654, count: 32, intensity: 0.7 },
    { name: "Brooklyn Bridge", x: 40.7061, y: -73.9969, count: 28, intensity: 0.6 },
    { name: "Grand Central", x: 40.7527, y: -73.9772, count: 25, intensity: 0.5 },
    { name: "Union Square", x: 40.7359, y: -73.9911, count: 22, intensity: 0.4 },
    { name: "Washington Square", x: 40.7308, y: -73.9973, count: 18, intensity: 0.3 },
    { name: "Bryant Park", x: 40.7536, y: -73.9832, count: 15, intensity: 0.2 },
    { name: "Rockefeller Center", x: 40.7587, y: -73.9787, count: 12, intensity: 0.1 },
  ];

  const fraudAlerts = dashboardData ? dashboardData.fraud_alerts.map((alert: any, index: number) => ({
    id: index + 1,
    type: `Low Trust Score (${alert.trust_score})`,
    user: alert.email,
    severity: alert.trust_score < 20 ? "high" : alert.trust_score < 40 ? "medium" : "low",
    time: "Recent activity"
  })) : [];

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "reports", label: "Reports", icon: Package },
    { id: "users", label: "Users", icon: Users },
    { id: "security", label: "Security", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-full w-72 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 
          border-r border-white/20 z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Lost&Found AI+</h2>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-colors
                  ${activeTab === item.id 
                    ? 'bg-gradient-to-r from-[#0066ff] to-[#06b6d4] text-white' 
                    : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
                whileHover={{ x: 5 }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-white/20">
            <button 
              onClick={() => onNavigate('home')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] 
                hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Exit Admin</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 
          border-b border-white/20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-[10px]"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 rounded-[10px] bg-white/50 dark:bg-white/5 
                      border border-white/20 focus:border-[#06b6d4] focus:outline-none"
                  />
                </div>

                {/* Notifications */}
                <motion.button
                  className="relative p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-[10px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full" />
                </motion.button>

                {/* Profile */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0066ff] to-[#06b6d4] 
                  flex items-center justify-center text-white font-semibold">
                  AD
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8">
              <GlassCard className="p-6 border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-500">Error Loading Dashboard</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                      <div className="text-3xl font-bold">{stat.value}</div>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    stat.change.startsWith('+') ? 'text-[#14b8a6]' : 'text-[#ef4444]'
                  }`}>
                    {stat.change} from last month
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Reports Chart */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Reports Overview</h3>
                  <select className="px-4 py-2 rounded-[10px] bg-white/50 dark:bg-white/5 
                    border border-white/20 text-sm">
                    <option>Last 6 Months</option>
                    <option>Last Year</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }} 
                    />
                    <Line type="monotone" dataKey="reports" stroke="#0066ff" strokeWidth={3} />
                    <Line type="monotone" dataKey="recovered" stroke="#14b8a6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>

            {/* Fraud Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
                  <h3 className="text-xl font-semibold">Fraud Alerts</h3>
                </div>
                <div className="space-y-4">
                  {fraudAlerts.map((alert: any) => (
                    <motion.div
                      key={alert.id}
                      className="p-4 rounded-[12px] bg-white/30 dark:bg-white/5 border border-white/10
                        hover:border-[#ef4444]/50 cursor-pointer transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-sm">{alert.type}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          alert.severity === 'high' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                          alert.severity === 'medium' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#64748b]/20 text-[#64748b]'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{alert.user}</div>
                      <div className="text-xs text-muted-foreground">{alert.time}</div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-6">Items by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066ff" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
            </>
          )}

          {/* Admin Tabs: Users and Reports Management */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Users Management */}
              {activeTab === 'users' && (
                <GlassCard className="p-6">
                  <h3 className="text-xl font-semibold mb-4">User Management</h3>
                  <div className="space-y-3">
                    {usersList.map((u: any) => (
                      <div key={u.uid} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{u.displayName || u.email}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.disabled ? (
                            <MagneticButton variant="secondary" onClick={() => handleEnableUser(u.uid)} disabled={actionLoading}>
                              Enable
                            </MagneticButton>
                          ) : (
                            <MagneticButton variant="destructive" onClick={() => handleDisableUser(u.uid)} disabled={actionLoading}>
                              Disable
                            </MagneticButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Reports / Claims Management */}
              {activeTab === 'reports' && (
                <GlassCard className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Claims & Reports</h3>
                  <div className="space-y-3">
                    {claimsList.map((c: any) => (
                      <div key={c.id} className="flex items-start justify-between p-3 rounded-[10px] bg-white/5 border border-white/10">
                        <div className="flex-1">
                          <div className="font-semibold">Claim: {c.id}</div>
                          <div className="text-xs text-muted-foreground">Item: {c.itemId} — Status: {c.status}</div>
                          <div className="text-xs text-muted-foreground mt-1">Submitted by: {c.userEmail || c.userId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MagneticButton variant="primary" onClick={() => handleApproveClaim(c.id)} disabled={actionLoading}>
                            Approve
                          </MagneticButton>
                          <MagneticButton variant="secondary" onClick={() => handleRejectClaim(c.id)} disabled={actionLoading}>
                            Reject
                          </MagneticButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
