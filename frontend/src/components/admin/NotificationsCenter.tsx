import React, { useState, useEffect } from 'react';
import { Bell, ShoppingCart, Star, ShieldAlert } from 'lucide-react';

interface Props {
  token: string;
  role: 'owner' | 'mwc';
}

export const NotificationsCenter: React.FC<Props> = ({ token, role }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = `http://localhost:5000/api/${role}`;

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const temp: any[] = [];

        // 1. Load orders alerts
        const resOrders = await fetch(`${apiBase}/orders`, { headers });
        if (resOrders.ok) {
          const orders = await resOrders.json();
          // Take first 3 orders
          orders.slice(0, 3).forEach((o: any) => {
            temp.push({
              id: `order-${o.id}`,
              type: 'order',
              title: 'New Order Received',
              message: `Order #${o.id} placed by user. Total: ₹${o.total_amount}. Status: ${o.status}`,
              time: o.created_at
            });
          });
        }

        // 2. Load reviews alerts
        const resReviews = await fetch(`${apiBase}/reviews`, { headers });
        if (resReviews.ok) {
          const reviews = await resReviews.json();
          // Take pending reviews
          reviews.filter((r: any) => r.status === 'pending').slice(0, 3).forEach((r: any) => {
            temp.push({
              id: `review-${r.id}`,
              type: 'review',
              title: 'Pending Review Awaiting Moderation',
              message: `"${r.text}" submitted by ${r.customer_name} (${r.rating} stars)`,
              time: r.created_at
            });
          });
        }

        // 3. Load MWC System announcements
        const resSettings = await fetch('http://localhost:5000/api/settings');
        if (resSettings.ok) {
          const settings = await resSettings.json();
          if (settings.announcement_banner) {
            temp.push({
              id: 'mwc-announcement',
              type: 'system',
              title: 'Active Banner Announcement',
              message: settings.announcement_banner,
              time: new Date().toISOString()
            });
          }
        }

        // Sort by time
        temp.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setAlerts(temp);
      } catch (err) {
        console.error('Error generating notification center alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [token, role]);

  if (loading) {
    return <div className="text-zinc-500 text-xs py-10">Fetching notifications...</div>;
  }

  return (
    <div className="max-w-xl mx-auto text-left space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold flex items-center gap-2">
          <Bell size={16} /> Notification Center
        </h3>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">{alerts.length} Alerts</span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-zinc-500 text-xs py-6 text-center uppercase tracking-widest bg-black/20 border border-zinc-800/80 rounded-2xl">No new updates or alerts.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isOrder = alert.type === 'order';
            const isReview = alert.type === 'review';

            return (
              <div key={alert.id} className="flex gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/20 shadow-md">
                <div className="w-9 h-9 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold flex-shrink-0">
                  {isOrder ? <ShoppingCart size={15} /> : isReview ? <Star size={15} /> : <ShieldAlert size={15} />}
                </div>
                <div className="space-y-1.5 text-left">
                  <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider">{alert.title}</h4>
                  <p className="text-zinc-400 text-xs leading-normal">{alert.message}</p>
                  <span className="text-[9px] text-zinc-500 block font-semibold">{new Date(alert.time).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default NotificationsCenter;
