// api/chat.js
// Vercel serverless function

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: 'Server misconfiguration: GEMINI_API_KEY is not set in Vercel environment variables.'
        });
    }

    const { contents, systemInstruction } = req.body || {};

    if (!contents) {
        return res.status(400).json({ error: 'Missing "contents" in request body.' });
    }

    try {
        const payload = { contents };

        // Safely format systemInstruction depending on whether it's sent as a string or an object
        if (systemInstruction) {
            if (typeof systemInstruction === 'string') {
                payload.system_instruction = {
                    parts: [{ text: systemInstruction }]
                };
            } else {
                payload.system_instruction = systemInstruction;
            }
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            return res.status(geminiResponse.status).json({
                error: data.error?.message || 'Gemini API request failed.'
            });
        }

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
};