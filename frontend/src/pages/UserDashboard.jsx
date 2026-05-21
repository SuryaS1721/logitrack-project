import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TrackingMap from '../components/TrackingMap';
import {
  Box,
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Navigation,
  Calendar,
  MapPin,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0 });
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getMyOrders({ limit: 10 });
      const orderList = res.data?.orders || [];
      setOrders(orderList);

      // Compute simple client-side statistics
      const computedStats = orderList.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.status === 'PENDING') acc.pending += 1;
          if (item.status === 'CONFIRMED' || item.status === 'SHIPPED') acc.shipped += 1;
          if (item.status === 'DELIVERED') acc.delivered += 1;
          return acc;
        },
        { total: 0, pending: 0, shipped: 0, delivered: 0 }
      );
      setStats(computedStats);

      // Resolve tracking hook (if user was redirected from placement receipt)
      const passedTrackingId = location.state?.activeTrackingId;
      if (passedTrackingId) {
        const match = orderList.find(o => o.trackingId === passedTrackingId);
        if (match) {
          setActiveTrackingOrder(match);
        }
      } else if (orderList.length > 0 && !activeTrackingOrder) {
        // Set first order as default active tracking order
        setActiveTrackingOrder(orderList[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync dashboard logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to cancel and delete this shipment?')) return;
    try {
      await orderAPI.cancel(id);
      alert('Order cancelled and deleted successfully!');

      // If we deleted the active tracking order, reset
      if (activeTrackingOrder && activeTrackingOrder._id === id) {
        setActiveTrackingOrder(null);
      }

      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing Satellite Logs...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Satellite dispatch center online. Monitor shipping vectors below.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          <RefreshCw size={14} /> Sync System
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', color: '#ef4444', fontSize: '0.85rem' }}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics stats dashboard */}
      <div className="dashboard-grid">
        <div className="glass-card stats-card">
          <div className="stats-icon"><Package size={20} /></div>
          <div>
            <p className="stats-value">{stats.total}</p>
            <p className="stats-label">Total Shipments</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-pending)', borderColor: 'rgba(245, 158, 11, 0.2)' }}><Clock size={20} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-pending)' }}>{stats.pending}</p>
            <p className="stats-label">Awaiting Dispatch</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-cyan)', borderColor: 'rgba(6, 182, 212, 0.2)' }}><Truck size={20} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-cyan)' }}>{stats.shipped}</p>
            <p className="stats-label">In Active Transit</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-delivered)', borderColor: 'rgba(16, 185, 129, 0.2)' }}><CheckCircle size={20} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-delivered)' }}>{stats.delivered}</p>
            <p className="stats-label">Arrived Safely</p>
          </div>
        </div>
      </div>

      {/* Main interactive map block */}
      {activeTrackingOrder ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', marginBottom: '40px', alignItems: 'stretch' }}>

          {/* Tracking Map Canvas */}
          <TrackingMap initialOrder={activeTrackingOrder} />

          {/* Quick Tracking Detail Panel Sidebar */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '16px' }}>
                <span className={`status-pill status-${activeTrackingOrder.status.toLowerCase()}`}>
                  {activeTrackingOrder.status}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {activeTrackingOrder.trackingId}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <MapPin size={12} color="var(--color-cyan)" /> PICKUP LOCATION
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeTrackingOrder.pickupAddress}</span>
                </div>

                <div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <Navigation size={12} color="#10b981" style={{ transform: 'rotate(45deg)' }} /> ROUTING TERMINAL
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeTrackingOrder.deliveryAddress}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <Box size={12} /> CLASS
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeTrackingOrder.packageType}</span>
                  </div>
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <Calendar size={12} /> EST. ARRIVAL
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>
                      {new Date(activeTrackingOrder.estimatedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Logs visual timeline list */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Manifest History logs
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                {activeTrackingOrder.history.map((log, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-cyan)', marginTop: '4px' }} />
                      {index < activeTrackingOrder.history.length - 1 && (
                        <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.status}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{log.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px', marginBottom: '40px', borderColor: 'rgba(255,255,255,0.03)' }}>
          <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>No Active Shipments Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            It looks like you haven't registered any packages yet. Get started by dispatching your first order!
          </p>
          <button onClick={() => navigate('/orders/new')} className="btn btn-primary" style={{ gap: '8px' }}>
            File Shipment Manifest <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      {/* Orders List summary table */}
      {orders.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Recent Dispatches</h3>
            <button onClick={() => navigate('/orders')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All Queue <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>TRACKING ID</th>
                  <th>DESTINATION</th>
                  <th>CARGO WEIGHT</th>
                  <th>INVOICE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-cyan)' }}>
                      {order.trackingId}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.deliveryAddress}
                    </td>
                    <td>{order.weight} kg</td>
                    <td style={{ fontWeight: 600 }}>${order.price.toFixed(2)}</td>
                    <td>
                      <span className={`status-pill status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => setActiveTrackingOrder(order)}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.7rem', borderRadius: '4px' }}
                      >
                        Track
                      </button>

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(order._id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.7rem', borderRadius: '4px' }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
