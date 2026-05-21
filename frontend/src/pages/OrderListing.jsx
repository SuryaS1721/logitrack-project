import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import {
  Search,
  Filter,
  Package,
  MapPin,
  Calendar,
  Box,
  ShieldAlert,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const OrderListing = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderAPI.getMyOrders({
        search,
        status: statusFilter,
        page,
        limit: 8
      });
      setOrders(res.data?.orders || []);
      setTotalPages(res.data?.pagination?.pages || 1);
      setTotalOrders(res.data.pagination.total);
    } catch (err) {
      setError(err.message || 'Failed to sync shipping manifests.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data on query parameter or page offset modifications
  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, page]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to cancel and delete this order?')) return;
    try {
      await orderAPI.cancel(id);
      alert('Order successfully deleted!');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            My Shipment <span className="gradient-text">Manifests</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Archived registry of all files, logistics pricing invoices, and active tracking paths.
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }}>
          <ArrowLeft size={14} /> Back to Radar
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', color: '#ef4444', fontSize: '0.85rem' }}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Advanced Filter Controls Toolbar */}
      <div className="glass-card" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Tracking ID, Sender, Recipient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Status Dropdown */}
        <div style={{ position: 'relative', width: '200px' }}>
          <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--text-secondary)' }} />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '10px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Syncing Registry...</p>
        </div>
      ) : orders.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {orders.map((order) => (
              <div key={order._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-cyan)', letterSpacing: '0.02em' }}>
                      {order.trackingId}
                    </span>
                    <span className={`status-pill status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <MapPin size={14} color="var(--color-cyan)" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>PICKUP</span>
                        <span style={{ fontWeight: 500 }}>{order.pickupAddress}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <MapPin size={14} color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>DELIVERY</span>
                        <span style={{ fontWeight: 500 }}>{order.deliveryAddress}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                      <div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}><Box size={12} /> CLASS</span>
                        <span style={{ fontWeight: 600 }}>{order.packageType} ({order.weight} kg)</span>
                      </div>
                      <div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}><Calendar size={12} /> PROJECTED</span>
                        <span style={{ fontWeight: 600, color: '#fbbf24' }}>
                          {new Date(order.estimatedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>TOTAL PRICE</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-cyan)' }}>${order.price.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/dashboard', { state: { activeTrackingId: order.trackingId } })}
                      className="btn btn-primary"
                      style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                    >
                      Track
                    </button>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        className="btn btn-danger"
                        style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', borderRadius: '6px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                Page <span style={{ color: '#fff', fontWeight: 700 }}>{page}</span> of {totalPages} ({totalOrders} Total orders)
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
        </>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>No Shipments Matched Search</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            We couldn't find any shipping records matching your search queries or filter categories.
          </p>
        </div>
      )}

    </div>
  );
};

export default OrderListing;
