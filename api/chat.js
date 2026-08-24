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

        // Normalize systemInstruction to match Gemini REST API requirements
        if (systemInstruction) {
            if (typeof systemInstruction === 'string') {
                payload.system_instruction = {
                    parts: [{ text: systemInstruction }]
                };
            } else {
                // If frontend already sent an object/array, pass it directly
                payload.system_instruction = systemInstruction;
            }
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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