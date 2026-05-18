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
    const now = Date.now();
    const sixtyDaysFromNow = now + (60 * 24 * 60 * 60 * 1000);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?locationId=${locationId}&startTime=${now}&endTime=${sixtyDaysFromNow}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log('GHL response status:', response.status);
    console.log('GHL events count:', data.events?.length ?? 'no events key');

    if (!data.events || data.events.length === 0) {
      return res.status(404).json({ error: "No upcoming appointments found." });
    }

    const searchFirst = firstName.trim().toLowerCase();
    const searchLast = lastName.trim().toLowerCase();

    const match = data.events.find(event => {
      const contactName = (event.contactName || '').toLowerCase();
      const title = (event.title || '').toLowerCase();
      return (
        contactName.includes(`${searchFirst} ${searchLast}`) ||
        (title.includes(searchFirst) && title.includes(searchLast))
      );
    });

    if (!match) {
      return res.status(404).json({ error: "No appointment found for that name." });
    }

    const dateObj = new Date(match.startTime);

    res.json({
      date: dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      barber: match.assignedTo || 'Your Barber',
      service: match.title || 'Grooming Service'
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error while searching.' });
  }
}
