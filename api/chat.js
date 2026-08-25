module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contents, systemInstruction } = req.body;

    // Converts Gemini request schema into OpenAI/NVIDIA compatible message format
    const messages = [
        {
            role: 'system',
            content: systemInstruction?.parts?.[0]?.text || 'You are a helpful assistant.'
        },
        ...contents.map((item) => ({
            role: item.role === 'model' ? 'assistant' : 'user',
            content: item.parts[0].text
        }))
    ];

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
                model: 'meta/llama-3.3-70b-instruct',
                messages: messages,
                temperature: 0.6,
                max_tokens: 1024,
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'NVIDIA API request failed');
        }

        const botReply = data.choices?.[0]?.message?.content || "No reply generated.";

        // Converts NVIDIA payload back to frontend's expected format
        return res.status(200).json({
            candidates: [
                {
                    content: {
                        parts: [{ text: botReply }]
                    }
                }
            ]
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};