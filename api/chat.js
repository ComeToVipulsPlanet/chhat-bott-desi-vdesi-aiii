// api/chat.js
// Vercel serverless function — this runs on the server, never in the browser.
// Your Gemini API key stays hidden here and is never sent to the client.

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Make sure the key was actually set in Vercel's environment variables
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
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    system_instruction: systemInstruction
                })
            }
        );

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            // Forward Gemini's own error message so the frontend can show something useful
            return res.status(geminiResponse.status).json({
                error: data.error?.message || 'Gemini API request failed.'
            });
        }

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
}
