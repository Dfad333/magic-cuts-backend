export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName } = req.body;
    const API_KEY = process.env.CRM_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'CRM_API_KEY not configured' });

    const locationId = '7zoZNtck1GsQYw6bX4Bi';
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Version': '2021-07-28',
      'Accept': 'application/json'
    };

    // Step 1: Search contacts by name using v2 API
    const contactsRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(firstName + ' ' + lastName)}`,
      { headers }
    );
    const contactsData = await contactsRes.json();
    console.log('Contacts status:', contactsRes.status);
    console.log('Contacts found:', contactsData.contacts?.length ?? 0);
    console.log('Contacts raw:', JSON.stringify(contactsData).slice(0, 500));

    const contacts = contactsData.contacts || [];
    if (contacts.length === 0) {
      return res.status(404).json({ error: 'No client found with that name.' });
    }

    // Step 2: Check every matching contact for appointments
    let upcomingApt = null;
    let barberName = 'Your Barber';
    let serviceName = 'Grooming Service';

    for (const contact of contacts) {
      const aptRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contact.id}/appointments`,
        { headers }
      );
      const aptData = await aptRes.json();
      console.log(`Appointments for ${contact.firstName} ${contact.lastName}:`, JSON.stringify(aptData).slice(0, 500));

      const appointments = aptData.appointments || aptData.events || [];
      const future = appointments.find(a => new Date(a.startTime) > new Date());
      if (future) {
        upcomingApt = future;
        // Parse barber/service from appointment description if available
        const desc = future.appointmentDescription || future.notes || '';
        const barberMatch = desc.match(/Barber:\s*([^|]+)/i);
        const serviceMatch = desc.match(/Service:\s*([^|]+)/i);
        if (barberMatch) barberName = barberMatch[1].trim();
        if (serviceMatch) serviceName = serviceMatch[1].trim();
        break;
      }
    }

    if (!upcomingApt) {
      return res.status(404).json({ error: 'No upcoming appointments found for that name.' });
    }

    const dateObj = new Date(upcomingApt.startTime);
    res.json({
      date: dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      barber: barberName,
      service: serviceName
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error while searching.' });
  }
}
