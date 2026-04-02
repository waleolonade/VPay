import React from 'react';

const Notifications = () => (
  <section>
    <h2 className="text-lg font-bold mb-4 text-brand-blue">Notifications</h2>
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <p className="text-gray-700 mb-2">Send broadcast notifications, email/SMS alerts, and push notifications to users.</p>
      {/* Example notification actions */}
      <div className="flex gap-4">
        <button className="bg-brand-blue text-white px-4 py-2 rounded">Send Email</button>
        <button className="bg-brand-green text-white px-4 py-2 rounded">Send SMS</button>
        <button className="bg-brand-dark text-white px-4 py-2 rounded">Send Push</button>
      </div>
    </div>
  </section>
);

export default Notifications;
