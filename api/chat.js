export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contents, systemInstruction } = req.body;
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'NVIDIA API key not configured on server.' });
    }

    // Format history from Gemini format to OpenAI/NVIDIA format
    const messages = [];

    // Add System Instruction if present
    if (systemInstruction?.parts?.[0]?.text) {
        messages.push({
            role: 'system',
            content: systemInstruction.parts[0].text
        });
    }

    // Map Gemini roles ('user', 'model') to NVIDIA roles ('user', 'assistant')
    if (Array.isArray(contents)) {
        contents.forEach((item) => {
            messages.push({
                role: item.role === 'model' ? 'assistant' : 'user',
                content: item.parts?.[0]?.text || ''
            });
        });
    }

    try {
        const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'meta/llama-3.1-405b-instruct', // Change to your preferred NVIDIA model
                messages: messages,
                temperature: 0.7,
                top_p: 1,
                max_tokens: 1024
            })
        });

        const data = await nvidiaResponse.json();

        if (!nvidiaResponse.ok) {
            throw new Error(data.detail || data.message || 'NVIDIA API Error');
        }

        const botReply = data.choices?.[0]?.message?.content || 'No response generated.';

        // Keep response structure compatible with your existing HTML frontend
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
}