export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName } = req.body;
    const API_KEY = process.env.CRM_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'CRM_API_KEY not configured' });
    }

    // Step A: Find the contact
    const contactRes = await fetch(`https://rest.gohighlevel.com/v1/contacts/?query=${firstName} ${lastName}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const contactData = await contactRes.json();
    
    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(404).json({ error: "No client found with that name." });
    }
    
    const contactId = contactData.contacts[0].id;

    // Step B: Get their appointments
    const aptRes = await fetch(`https://rest.gohighlevel.com/v1/appointments/?contactId=${contactId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const aptData = await aptRes.json();

    if (!aptData.appointments || aptData.appointments.length === 0) {
      return res.status(404).json({ error: "No upcoming appointments found." });
    }

    // Get the most recent future appointment
    const upcomingApt = aptData.appointments.find(apt => new Date(apt.startTime) > new Date()) || aptData.appointments[0];

    // Send it back
    res.json({
      date: new Date(upcomingApt.startTime).toLocaleDateString(),
      time: new Date(upcomingApt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      barber: upcomingApt.calendarName || "Your Barber",
      service: upcomingApt.title || "Your Service"
    });

  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Server error while searching for appointment." });
  }
}
