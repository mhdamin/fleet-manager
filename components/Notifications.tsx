import React, { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button, SectionHeader, StatCard, StatusBadge, TableCard } from './AppUI';
import { getNotificationEvents, markNotificationRead } from '../services/enterprise';
import { NotificationEvent } from '../types';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  const loadData = async () => {
    try { setNotifications(await getNotificationEvents()); setWarning(null); } catch { setWarning('Unable to load notifications.'); }
  };
  useEffect(() => { loadData(); }, []);

  const handleMarkRead = async (notification: NotificationEvent) => {
    try { await markNotificationRead(notification.id); await loadData(); } catch { setWarning('Failed to update notification.'); }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Notification Center" description="Track operational, finance, and customer-facing alerts across the platform." warning={warning} />
      <div className="app-grid app-grid--stats"><StatCard label="Notifications" value={notifications.length} icon={<BellRing size={20} />} /><StatCard label="Unread" value={notifications.filter((item) => item.status === 'Unread').length} /><StatCard label="Operations" value={notifications.filter((item) => item.channel === 'Operations').length} /><StatCard label="Finance / Customer" value={notifications.filter((item) => item.channel !== 'Operations').length} /></div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Title</th><th>Channel</th><th>Message</th><th>Created</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{notifications.map((item) => <tr key={item.id}><td style={{ fontWeight: 600 }}>{item.title}</td><td>{item.channel}</td><td className="app-muted">{item.body}</td><td>{new Date(item.createdAt).toLocaleString()}</td><td><StatusBadge tone={item.status === 'Read' ? 'success' : 'warning'}>{item.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}>{item.status === 'Unread' ? <Button variant="secondary" size="sm" type="button" onClick={() => handleMarkRead(item)}>Mark Read</Button> : null}</div></td></tr>)}</tbody></table></div></TableCard>
    </div>
  );
};

export default Notifications;
