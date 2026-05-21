import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import TrackingMap from '../components/TrackingMap';
import {
  Shield,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Compass,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, shipped: 0, delivered: 0, totalOrders: 0 });
  const [activeRadarOrder, setActiveRadarOrder] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderAPI.getAllOrders({
        search,
        status: statusFilter,
        page,
        limit: 6
      });
      setOrders(res.data?.orders || []);
      setStats(res.data.stats);
      setTotalPages(res.data.pagination.pages);

      // Default active radar targeting
      const orderList = res.data?.orders || [];
      if (orderList.length > 0 && !activeRadarOrder) {
        setActiveRadarOrder(orderList[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync platform dispatch logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [search, statusFilter, page]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await orderAPI.updateStatus(orderId, newStatus);

      // Update local tracking context if active
      if (activeRadarOrder && activeRadarOrder._id === orderId) {
        const syncedOrder = await orderAPI.getById(orderId);
        setActiveRadarOrder(syncedOrder.data.order);
      }

      fetchAdminData();
    } catch (err) {
      alert(`Dispatch Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'var(--color-pending)';
      case 'CONFIRMED': return 'var(--color-confirmed)';
      case 'SHIPPED': return 'var(--color-shipped)';
      case 'DELIVERED': return 'var(--color-delivered)';
      default: return 'var(--text-secondary)';
    }
  };

  // Custom visual metrics calculation for charts
  const totalInvoiced = orders.reduce((sum, order) => sum + order.price, 0);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Dispatch <span className="gradient-text">Control Tower</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Global logistics terminal. Update cargo states and coordinate flight vectors.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', color: '#ef4444', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Stats Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        <div className="glass-card stats-card" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="stats-icon"><ClipboardList size={18} /></div>
          <div>
            <p className="stats-value">{stats.totalOrders}</p>
            <p className="stats-label">Platform Volume</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-pending)', borderColor: 'rgba(245, 158, 11, 0.2)' }}><Clock size={18} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-pending)' }}>{stats.pending}</p>
            <p className="stats-label">Awaiting Confirm</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-confirmed)', borderColor: 'rgba(59, 130, 246, 0.2)' }}><Package size={18} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-confirmed)' }}>{stats.confirmed}</p>
            <p className="stats-label">Confirmed Dispatch</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-shipped)', borderColor: 'rgba(139, 92, 246, 0.2)' }}><Truck size={18} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-shipped)' }}>{stats.shipped}</p>
            <p className="stats-label">Shipped Transit</p>
          </div>
        </div>

        <div className="glass-card stats-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-delivered)', borderColor: 'rgba(16, 185, 129, 0.2)' }}><CheckCircle size={18} /></div>
          <div>
            <p className="stats-value" style={{ color: 'var(--color-delivered)' }}>{stats.delivered}</p>
            <p className="stats-label">Delivered Cargo</p>
          </div>
        </div>
      </div>

      {/* Live Map Panel & Advanced Visual Graphics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', marginBottom: '40px', alignItems: 'stretch' }}>

        {/* Radar Map Component */}
        {activeRadarOrder ? (
          <TrackingMap initialOrder={activeRadarOrder} />
        ) : (
          <div className="canvas-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Compass size={40} style={{ animation: 'spin 10s infinite linear', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'var(--font-display)' }}>Satellite Tracking Inactive. Locate order below.</p>
          </div>
        )}

        {/* Dynamic SVG Visual Charts (Volume distribution metrics) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--color-cyan)" /> Queue Metrics
            </h3>

            {/* Custom SVG Distribution Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Awaiting Confirmation</span>
                  <span style={{ color: 'var(--color-pending)', fontWeight: 700 }}>
                    {stats.totalOrders ? Math.round((stats.pending / stats.totalOrders) * 100) : 0}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.totalOrders ? (stats.pending / stats.totalOrders) * 100 : 0}%`, height: '100%', background: 'var(--color-pending)', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Confirmed & Preparing</span>
                  <span style={{ color: 'var(--color-confirmed)', fontWeight: 700 }}>
                    {stats.totalOrders ? Math.round((stats.confirmed / stats.totalOrders) * 100) : 0}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.totalOrders ? (stats.confirmed / stats.totalOrders) * 100 : 0}%`, height: '100%', background: 'var(--color-confirmed)', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>In Active Transit</span>
                  <span style={{ color: 'var(--color-shipped)', fontWeight: 700 }}>
                    {stats.totalOrders ? Math.round((stats.shipped / stats.totalOrders) * 100) : 0}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.totalOrders ? (stats.shipped / stats.totalOrders) * 100 : 0}%`, height: '100%', background: 'var(--color-shipped)', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Delivered Cargo</span>
                  <span style={{ color: 'var(--color-delivered)', fontWeight: 700 }}>
                    {stats.totalOrders ? Math.round((stats.delivered / stats.totalOrders) * 100) : 0}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.totalOrders ? (stats.delivered / stats.totalOrders) * 100 : 0}%`, height: '100%', background: 'var(--color-delivered)', borderRadius: '999px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue metrics display */}
          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="stats-icon" style={{ width: '40px', height: '40px', background: 'rgba(6,182,212,0.1)', color: 'var(--color-cyan)' }}>
              <DollarSign size={18} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTIVE QUEUE INVOICED</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>${totalInvoiced.toFixed(2)}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Global queue filter toolbar */}
      <div className="glass-card" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Order ID, Sender, Recipient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Filter status */}
        <div style={{ position: 'relative', width: '200px' }}>
          <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">All Platform statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--text-secondary)' }} />
        </div>
      </div>

      {/* Table queue */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '10px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Polling Dispatch Tower Logs...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '20px' }}>Global Freight Queue</h3>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>TRACKING ID</th>
                  <th>CUSTOMER</th>
                  <th>ROUTE (PICKUP → DELIVERY)</th>
                  <th>WEIGHT</th>
                  <th>INVOICE</th>
                  <th>STATUS VECTOR</th>
                  <th style={{ textAlign: 'right' }}>COMMANDS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-cyan)' }}>
                      {order.trackingId}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{order.customer?.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.customer?.email}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{order.pickupAddress}</span>
                      {' → '}
                      <span style={{ fontWeight: 500 }}>{order.deliveryAddress}</span>
                    </td>
                    <td>{order.weight} kg</td>
                    <td style={{ fontWeight: 600 }}>${order.price.toFixed(2)}</td>
                    <td>
                      <div style={{ position: 'relative', width: '135px' }}>
                        <select
                          className="form-control"
                          value={order.status}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          style={{
                            padding: '4px 24px 4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: getStatusColor(order.status),
                            borderColor: getStatusColor(order.status),
                            background: 'rgba(0, 0, 0, 0.4)',
                            appearance: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="PENDING" style={{ color: 'var(--color-pending)' }}>PENDING</option>
                          <option value="CONFIRMED" style={{ color: 'var(--color-confirmed)' }}>CONFIRMED</option>
                          <option value="SHIPPED" style={{ color: 'var(--color-shipped)' }}>SHIPPED</option>
                          <option value="DELIVERED" style={{ color: 'var(--color-delivered)' }}>DELIVERED</option>
                        </select>
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${getStatusColor(order.status)}` }} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveRadarOrder(order)}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.7rem', borderRadius: '4px' }}
                      >
                        Locate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', borderRadius: '6px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                Page <span style={{ color: '#fff', fontWeight: 700 }}>{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', borderRadius: '6px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Global Queue Empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No platform shipments match your filtering queries.
          </p>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
