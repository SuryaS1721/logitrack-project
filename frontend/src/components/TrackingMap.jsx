import React, { useRef, useEffect, useState } from 'react';
import { orderAPI } from '../services/api';
import { RefreshCw, Navigation, Compass } from 'lucide-react';

const TrackingMap = ({ initialOrder }) => {
  const canvasRef = useRef(null);
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [radarAngle, setRadarAngle] = useState(0);

  // Poll API to fetch fresh simulated coordinate points if in transit
  useEffect(() => {
    setOrder(initialOrder);
    
    if (initialOrder.status !== 'SHIPPED') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await orderAPI.getById(initialOrder._id || initialOrder.trackingId);
        setOrder(res.data.order);
      } catch (err) {
        console.error('Failed to sync coordinates:', err.message);
      }
    }, 4000); // Syncs state coordinates every 4 seconds

    return () => clearInterval(pollInterval);
  }, [initialOrder]);

  // Radar sweep animation hook
  useEffect(() => {
    let animId;
    const tickRadar = () => {
      setRadarAngle((prev) => (prev + 0.02) % (Math.PI * 2));
      animId = requestAnimationFrame(tickRadar);
    };
    animId = requestAnimationFrame(tickRadar);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas drawing operations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear screen
    ctx.fillStyle = '#020510';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw glowing grid coordinate mesh
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw radar sweeping beam
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(width, height) / 1.5, radarAngle, radarAngle + 0.25);
    ctx.lineTo(0, 0);
    ctx.closePath();
    const radarGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) / 1.5);
    radarGradient.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
    radarGradient.addColorStop(1, 'rgba(6, 182, 212, 0.07)');
    ctx.fillStyle = radarGradient;
    ctx.fill();
    ctx.restore();

    const { pickup, delivery, current } = order.coordinates || { pickup: {x:120, y:200}, delivery: {x:580, y:200}, current: {x:120, y:200} };

    // 3. Draw dotted vector flight route
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 8]);
    ctx.moveTo(pickup.x, pickup.y);
    ctx.lineTo(delivery.x, delivery.y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line style

    // 4. Draw Pickup waypoint
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#6366f1';
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Label pickup
    ctx.font = 'bold 10px Outfit';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('PICKUP HUB', pickup.x - 30, pickup.y - 15);

    // 5. Draw Delivery waypoint
    ctx.beginPath();
    ctx.arc(delivery.x, delivery.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#10b981';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label delivery
    ctx.font = 'bold 10px Outfit';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('DESTINATION', delivery.x - 30, delivery.y - 15);

    // 6. Draw active courier position (flying paper airplane SVG mockup)
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      ctx.save();
      ctx.translate(current.x, current.y);
      
      // Calculate flight path heading angle (heading of flight)
      const angle = Math.atan2(delivery.y - pickup.y, delivery.x - pickup.x);
      ctx.rotate(angle);

      // Draw airplane icon glow ring
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.strokeStyle = order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw glowing body
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(14, 0);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      
      ctx.fillStyle = order.status === 'DELIVERED' ? '#10b981' : '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.shadowColor = order.status === 'DELIVERED' ? '#10b981' : '#06b6d4';
      ctx.fill();
      ctx.restore();
    }

  }, [order, radarAngle]);

  const handleManualSync = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getById(order._id || order.trackingId);
      setOrder(res.data.order);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute calculated progress percent
  const getProgressPercent = () => {
    if (order.status === 'PENDING' || order.status === 'CONFIRMED') return 0;
    if (order.status === 'DELIVERED') return 100;
    
    // Compute percentage relative to Euclidean distance
    const { pickup, delivery, current } = order.coordinates;
    const totalDist = Math.sqrt(Math.pow(delivery.x - pickup.x, 2) + Math.pow(delivery.y - pickup.y, 2));
    const currentDist = Math.sqrt(Math.pow(current.x - pickup.x, 2) + Math.pow(current.y - pickup.y, 2));
    return Math.min(100, Math.round((currentDist / totalDist) * 100));
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass className="gradient-text" style={{ animation: 'spin 12s infinite linear' }} />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>Satellite Dispatch Radar</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {order.status === 'SHIPPED' && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={12} style={{ animation: 'pulse 1.5s infinite' }} /> Tracking Active...
            </span>
          )}
          <button 
            onClick={handleManualSync} 
            disabled={loading}
            className="btn btn-secondary" 
            style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem' }}
          >
            <RefreshCw size={12} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas 
          ref={canvasRef} 
          width={720} 
          height={380} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          <span>Current Transit Progress:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{getProgressPercent()}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${getProgressPercent()}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)', 
              boxShadow: '0 0 8px #06b6d4', 
              transition: 'width 0.8s ease-in-out' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
