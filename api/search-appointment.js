app.post('/search-appointment', async (req, res) => {
  const { firstName, lastName } = req.body;
  const API_KEY = process.env.CRM_API_KEY;
  const LOCATION_ID = "7zoZNtck1GsQYw6bX4Bi"; // Your specific location ID

  try {
    // 1. Find the contact properly encoded
    const query = encodeURIComponent(`${firstName} ${lastName}`);
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/search?query=${query}`, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}`, 
        'Version': '2021-07-28',
        'Location-Id': LOCATION_ID
      }
    });
    
    const contactData = await contactRes.json();
    
    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(404).json({ error: "No client found with that name." });
    }
    
    const contactId = contactData.contacts[0].id;

    // 2. Find appointments for that contact
    const apptRes = await fetch(`https://services.leadconnectorhq.com/calendars/events?contactId=${contactId}`, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}`, 
        'Version': '2021-04-15',
        'Location-Id': LOCATION_ID
      }
    });
    
    const apptData = await apptRes.json();

    if (!apptData.events || apptData.events.length === 0) {
      return res.status(404).json({ error: "No upcoming appointments found." });
    }

    // 3. Format the most recent appointment
    const appointment = apptData.events[0]; 
    const dateObj = new Date(appointment.startTime);

    res.json({
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      barber: appointment.calendarName || "Assigned Barber", 
      service: appointment.title || "Service"
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Could not connect to the booking system." });
  }
});
