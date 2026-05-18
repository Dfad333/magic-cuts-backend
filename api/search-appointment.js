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

    const calendars = [
      { id: '6kZ6XFwlc8ct4ZAKNixQ', barber: 'Alejandro', service: 'Haircut' },
      { id: 'FDoOxcuEb7FiWuGdbQRB', barber: 'Alejandro', service: 'Beard Coloring' },
      { id: '7UXg7diA0Z5IqyLf8R3z', barber: 'Alejandro', service: 'Kids (8 & Under)' },
      { id: 'kqsbRkvAwxxRIBYu8Dd2', barber: 'Alejandro', service: 'Beard Trim' },
      { id: 'VptVsqAKl1z9XZAk4SCx', barber: 'Alejandro', service: 'Hair Coloring' },
      { id: 'wlp6vszjV7NAYkrGLdft', barber: 'Alejandro', service: 'Haircut & Beard' },
      { id: 'xFapRnLCXqU0r0NwnnU2', barber: 'Alejandro', service: 'Hair Wash' },
      { id: 'SJ5x3F96AGVsdvgX9yVa', barber: 'Alejandro', service: 'Facial Cleaning' },
      { id: '6AL7FZaOdivzaTpBpRFQ', barber: 'Alejandro', service: 'Styling' },

      { id: '595Snd0MCEkBtl5IEvAl', barber: 'Bashar', service: 'Haircut' },
      { id: 'D9PZviPOZfdMy2Ims5Td', barber: 'Bashar', service: 'Beard Coloring' },
      { id: 'RAjWyiW6qSefFbwpSTY7', barber: 'Bashar', service: 'Kids (8 & Under)' },
      { id: 'VoAyVnDMD2L6moqcyM0j', barber: 'Bashar', service: 'Beard Trim' },
      { id: 'Z4oezHvdQP9W72fn1Bay', barber: 'Bashar', service: 'Hair Coloring' },
      { id: 'dQeEzHZS8D39MkT5aka8', barber: 'Bashar', service: 'Haircut & Beard' },
      { id: 'eRyVGkAfCx180yJHxa81', barber: 'Bashar', service: 'Hair Wash' },
      { id: 'fuE4528Bro7i4pbjfF5I', barber: 'Bashar', service: 'Facial Cleaning' },
      { id: 'mkXVZyBE8XgYTQyob2KP', barber: 'Bashar', service: 'Styling' },

      { id: 'MT6qPuH5plalzV7bdV3D', barber: 'Bebo', service: 'Haircut' },
      { id: 'Re62RjcPi2m0FNnbEcKp', barber: 'Bebo', service: 'Beard Coloring' },
      { id: 'LP4QCJufZe96SrH0H0Ak', barber: 'Bebo', service: 'Kids (8 & Under)' },
      { id: 'Lum2W72YaH1eShV6lAai', barber: 'Bebo', service: 'Beard Trim' },
      { id: 'kU9KlcL6GETZB7tJqJXd', barber: 'Bebo', service: 'Hair Coloring' },
      { id: 'oE5vU1m4JpH1mZHWQKon', barber: 'Bebo', service: 'Haircut & Beard' },
      { id: 'eR2a8wK9wkSBcIxeM9oT', barber: 'Bebo', service: 'Hair Wash' },
      { id: 'v9W6K7DjuVTWYNd8NI3D', barber: 'Bebo', service: 'Facial Cleaning' },
      { id: 'ZgnJFMqWCo5BViAmgWPD', barber: 'Bebo', service: 'Styling' },

      { id: 'oHo0OlKbGJTsfAJWbnsp', barber: 'Luis', service: 'Haircut' },
      { id: 'Erz7O1po9m4j3pbd6dGE', barber: 'Luis', service: 'Beard Coloring' },
      { id: 'naI9DYy07xAXnZjkLw0i', barber: 'Luis', service: 'Kids (8 & Under)' },
      { id: 'jUck950qLh6vmrrdEzlj', barber: 'Luis', service: 'Beard Trim' },
      { id: 'LwrMJCkfDVeM1VqocFc8', barber: 'Luis', service: 'Hair Coloring' },
      { id: 'ATtOrngPPVbdsa9yy2kY', barber: 'Luis', service: 'Haircut & Beard' },
      { id: 'D1gF3ToXpkNHtDVqZQse', barber: 'Luis', service: 'Hair Wash' },
      { id: 'SmxdqqyVlf5VF96ThDlZ', barber: 'Luis', service: 'Facial Cleaning' },
      { id: 'E6sLoa6GJXSHZb00UGkK', barber: 'Luis', service: 'Styling' },
    ];

    const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const results = await Promise.all(
      calendars.map(async (cal) => {
        const url = `https://services.leadconnectorhq.com/calendars/events?locationId=${locationId}&calendarId=${cal.id}&startTime=${startTime}&endTime=${endTime}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Version': '2021-04-15',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        return (data.events || []).map(e => ({ ...e, barberName: cal.barber, serviceName: cal.service }));
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
      barber: match.barberName,
      service: match.serviceName
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error while searching.' });
  }
}
