export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName } = req.body;
    const API_KEY = process.env.CRM_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'CRM_API_KEY not configured' });
    }

    const contactRes = await fetch(`https://rest.gohighlevel.com/v1/contacts/?query=${encodeURIComponent(firstName + ' ' + lastName)}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const contactData = await contactRes.json();

    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(404).json({ error: "No client found with that name." });
    }

    const contactId = contactData.contacts[0].id;

    const aptRes = await fetch(`https://rest.gohighlevel.com/v1/appointments/?contactId=${contactId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const aptData = await aptRes.json();

    if (!aptData.appointments || aptData.appointments.length === 0) {
      return res.status(404).json({ error: "No upcoming appointments found." });
    }

    const upcomingApt = aptData.appointments.find(apt => new Date(apt.startTime) > new Date()) || aptData.appointments[0];

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
