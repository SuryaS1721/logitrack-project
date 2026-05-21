import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { Navigation, Scale, Box, DollarSign, Calendar, FileText, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

const CreateOrder = () => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageType, setPackageType] = useState('Standard');
  const [weight, setWeight] = useState(1);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [estimatedDate, setEstimatedDate] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const navigate = useNavigate();

  // Run dynamic price & delivery date calculation on field changes
  useEffect(() => {
    // Dynamic Price Logic
    let base = 12.0;
    const weightVal = parseFloat(weight) || 0;
    const weightFee = weightVal * 2.5;
    let premium = 0.0;
    
    switch (packageType) {
      case 'Fragile': premium = 8.5; break;
      case 'Express': premium = 15.0; break;
      case 'Hazardous': premium = 25.0; break;
      default: premium = 0.0;
    }

    const price = Math.round((base + weightFee + premium) * 100) / 100;
    setEstimatedPrice(price);

    // Estimated Delivery Date
    const daysToAdd = packageType === 'Express' ? 1 : 3;
    const est = new Date();
    est.setDate(est.getDate() + daysToAdd);
    setEstimatedDate(est.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, [weight, packageType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Front-end checks
    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      setError('Please provide valid pickup and delivery addresses.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 0.1) {
      setError('Freight weight must be at least 0.1 kg.');
      return;
    }

    setLoading(true);
    try {
      const res = await orderAPI.create({
        pickupAddress,
        deliveryAddress,
        packageType,
        weight: weightNum
      });
      setCreatedOrder(res.data.order);
    } catch (err) {
      setError(err.message || 'Failed to file the delivery order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If order is successfully created, show beautiful cargo receipt!
  if (createdOrder) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-card glow-cyan" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '50%', padding: '16px', marginBottom: '24px' }}>
            <CheckCircle size={40} style={{ animation: 'pulse 2s infinite' }} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Shipment Registered!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '28px' }}>
            Your cargo manifest has been filed. Active satellite tracking initialized.
          </p>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TRACKING NUMBER</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-cyan)', letterSpacing: '0.05em' }}>{createdOrder.trackingId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CARGO WEIGHT / TIER</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{createdOrder.weight} kg / {createdOrder.packageType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ESTIMATED DELIVERY</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>
                {new Date(createdOrder.estimatedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>TOTAL INVOICED</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-cyan)' }}>${createdOrder.price.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => navigate('/dashboard', { state: { activeTrackingId: createdOrder.trackingId } })}
              className="btn btn-primary"
              style={{ width: '100%', gap: '8px' }}
            >
              Open Satellite Tracker <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setCreatedOrder(null)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Register Another Package
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
          File a <span className="gradient-text">Delivery manifest</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Input cargo coordinates and freight dimensions to compute logistics route.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', color: '#ef4444', fontSize: '0.85rem' }}>
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>
        {/* Main Form Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '30px' }}>
          
          <div className="form-group">
            <label className="form-label" htmlFor="pickup-input">Pickup Address</label>
            <div style={{ position: 'relative' }}>
              <Navigation size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px', transform: 'rotate(45deg)' }} />
              <textarea
                id="pickup-input"
                className="form-control"
                placeholder="Sender Address / City Distribution Hub"
                rows={2}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                style={{ paddingLeft: '40px', resize: 'vertical' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="delivery-input">Delivery Destination Address</label>
            <div style={{ position: 'relative' }}>
              <Navigation size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <textarea
                id="delivery-input"
                className="form-control"
                placeholder="Recipient Address / Delivery Terminal"
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                style={{ paddingLeft: '40px', resize: 'vertical' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="package-type-select">Package Class</label>
              <div style={{ position: 'relative' }}>
                <Box size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  id="package-type-select"
                  className="form-control"
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  style={{ paddingLeft: '40px', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="Standard">Standard Ground</option>
                  <option value="Fragile">Fragile Handling</option>
                  <option value="Express">Next-Day Express</option>
                  <option value="Hazardous">Hazardous Cargo</option>
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--text-secondary)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="weight-input">Cargo Weight (kg)</label>
              <div style={{ position: 'relative' }}>
                <Scale size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="weight-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-control"
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : 'Dispatch Shipment'}
          </button>
        </form>

        {/* Invoice Summary Sidebar Panel */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--color-cyan)" /> Freight Estimate
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="stats-icon" style={{ flexShrink: 0 }}><DollarSign size={16} /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>INVOICE (EST.)</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-cyan)' }}>${estimatedPrice.toFixed(2)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="stats-icon" style={{ flexShrink: 0 }}><Calendar size={16} /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PROJECTED DELIVERY</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{estimatedDate}</p>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p>• Weight surcharge calculated at $2.50 per kg.</p>
            {packageType === 'Fragile' && <p style={{ color: 'var(--color-cyan)' }}>• Premium secure insulation applied for Fragile items (+$8.50).</p>}
            {packageType === 'Express' && <p style={{ color: '#fbbf24' }}>• Express Priority air routing applied (+$15.00).</p>}
            {packageType === 'Hazardous' && <p style={{ color: '#ef4444' }}>• Compliance certification & specialized carriage applied (+$25.00).</p>}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CreateOrder;
