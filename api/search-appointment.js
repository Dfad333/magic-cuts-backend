app.post('/api/search-appointment', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const locationId = "7zoZNtck1GsQYw6bX4Bi"; // Your location ID
    
    // 1. Fetch upcoming appointments directly from the calendar
    const response = await fetch(`https://services.leadconnectorhq.com/calendars/events?locationId=${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.YOUR_API_KEY}`, // Ensure this matches your API key variable name
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data.events || data.events.length === 0) {
      return res.status(404).json({ error: "No upcoming appointments found." });
    }

    const searchFirst = firstName.trim().toLowerCase();
    const searchLast = lastName.trim().toLowerCase();

    // 2. Filter the calendar events to find a match by name on the calendar itself
    const myAppointment = data.events.find(event => {
      const contactName = (event.contactName || "").toLowerCase();
      const title = (event.title || "").toLowerCase();
      
      return (
        contactName.includes(`${searchFirst} ${searchLast}`) || 
        (title.includes(searchFirst) && title.includes(searchLast))
      );
    });

    if (!myAppointment) {
      return res.status(404).json({ error: "No appointment found for this name." });
    }

    // 3. Format the date and time to send back to the website
    const dateObj = new Date(myAppointment.startTime);
    
    res.json({
      date: dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      barber: myAppointment.assignedTo || "Your Barber", 
      service: myAppointment.title || "Grooming Service"
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Server error while searching." });
  }
});
