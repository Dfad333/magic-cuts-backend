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

    const searchFirst = firstName.trim().toLowerCase();
    const searchLast = lastName.trim().toLowerCase();

    // Find contacts two ways: by searched name AND by the dummy contact email
    const [nameRes, dummyRes] = await Promise.all([
      fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(firstName + ' ' + lastName)}`, { headers }),
      fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=no-email%40example.com`, { headers })
    ]);

    const [nameData, dummyData] = await Promise.all([nameRes.json(), dummyRes.json()]);

    // Combine and deduplicate contacts
    const allContacts = [...(nameData.contacts || []), ...(dummyData.contacts || [])];
    const uniqueContacts = allContacts.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);

    console.log('Unique contacts to check:', uniqueContacts.length);

    let upcomingApt = null;
    let barberName = 'Your Barber';
    let serviceName = 'Grooming Service';

    // Calculate the time 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const contact of uniqueContacts) {
      const aptRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contact.id}/appointments`,
        { headers }
      );
      const aptData = await aptRes.json();
      const appointments = aptData.appointments || aptData.events || [];

      console.log(`Contact ${contact.firstName} ${contact.lastName}: ${appointments.length} appointments`);

      const match = appointments.find(apt => {
        const title = (apt.title || '').toLowerCase();
        // Check if appointment is after 24 hours ago instead of strictly in the future
        return title.includes(searchFirst) && title.includes(searchLast) && new Date(apt.startTime) > twentyFourHoursAgo;
      });

      if (match) {
        upcomingApt = match;
        const desc = match.appointmentDescription || match.notes || '';
        const barberMatch = desc.match(/Barber:\s*([^|]+)/i);
        const serviceMatch = desc.match(/Service:\s*([^|]+)/i);
        if (barberMatch) barberName = barberMatch[1].trim();
        if (serviceMatch) serviceName = serviceMatch[1].trim();
        break;
      }
    }

    if (!upcomingApt) {
      return res.status(404).json({ error: 'No recent or upcoming appointment found for that name.' });
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
