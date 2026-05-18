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
    const calendarIds = [
      { id: '7upZjy9EHaxoga6rVC9k', name: 'Bebo' },
      { id: 'HNI4myeBc1oQZef9BnT3', name: 'Alejandro' },
      { id: 'uqJ4VfsHah4mBaN5DDAP', name: 'Bashar' },
      { id: 'IydhVhv7iNfjBuJeiKvl', name: 'Luis' }
    ];

    const startTime = Date.now();
    const endTime = startTime + (60 * 24 * 60 * 60 * 1000);

    const results = await Promise.all(
      calendarIds.map(async (cal) => {
        const url = `https://services.leadconnectorhq.com/calendars/events?locationId=${locationId}&calendarId=${cal.id}&startTime=${startTime}&endTime=${endTime}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Version': '2021-04-15',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        console.log(`${cal.name} — status: ${response.status}, events: ${data.events?.length ?? 'no key'}, keys: ${Object.keys(data).join(',')}`);
        const events = (data.events || []).map(e => ({ ...e, barberName: cal.name }));
        return events;
      })
    );

    const allEvents = results.flat();
    console.log('Total events found:', allEvents.length);

    const searchFirst = firstName.trim().toLowerCase();
    const searchLast = lastName.trim().toLowerCase();

    const match = allEvents.find(event => {
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
      barber: match.barberName || 'Your Barber',
      service: match.title || 'Grooming Service'
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error while searching.' });
  }
}
