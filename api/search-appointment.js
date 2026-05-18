export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName } = req.body;
  const API_KEY = process.env.CRM_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'CRM_API_KEY not configured' });
  }

  try {
    // 1. Find the contact in your CRM
    const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/search?query=${firstName} ${lastName}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Version': '2021-07-28' }
    });
    const contactData = await contactRes.json();
    
    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(404).json({ error: "No client found with that name." });
    }
    
    const contactId = contactData.contacts[0].id;

    // 2. Find appointments for that contact
    const apptRes = await fetch(`https://services.leadconnectorhq.com/appointments/?contactId=${contactId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Version': '2021-04-15' }
    });
    const apptData = await apptRes.json();

    if (!apptData.appointments || apptData.appointments.length === 0) {
      return res.status(404).json({ error: "No upcoming appointments found." });
    }

    // 3. Format the most recent appointment
    const appointment = apptData.appointments[0]; 
    const dateObj = new Date(appointment.startTime);

    res.json({
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      barber: appointment.calendarName || "Assigned Barber", 
      service: appointment.title || "Service"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not connect to the booking system." });
  }
}
