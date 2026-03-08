const REPLICATE_API = "https://api.replicate.com/v1/predictions";
const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;

export const maxDuration = 60;

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "Invalid JSON: " + e.message }, { status: 400 });
    }

    const { imageBase64, prompt, roomType, element, pollId } = body;

    // POLL MODE
    if (pollId) {
      const pollRes = await fetch(`${REPLICATE_API}/${pollId}`, {
        headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
      });
      const pollData = await pollRes.json();
      return Response.json({
        status: pollData.status,
        imageUrl: pollData.status === "succeeded"
          ? (Array.isArray(pollData.output) ? pollData.output[0] : pollData.output)
          : null,
        error: pollData.error || null,
      });
    }

    // START MODE
    if (!REPLICATE_TOKEN) {
      return Response.json({ error: "REPLICATE_TOKEN not set" }, { status: 500 });
    }

    const instruction = prompt || `A photorealistic interior design photo of a ${roomType || "room"} with ${element || "updated design"}. Professional photography, natural light, no people.`;

    console.log("Starting prediction, prompt:", instruction.substring(0, 100));

    // Use stability-ai/sdxl with img2img - well supported model
    const reqBody = {
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: {
        image: `data:image/jpeg;base64,${imageBase64}`,
        prompt: instruction,
        prompt_strength: 0.65,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        negative_prompt: "people, text, watermark, blurry, low quality, cartoon",
        num_outputs: 1,
        width: 768,
        height: 768,
      },
    };

    const startRes = await fetch(REPLICATE_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "respond-async",
      },
      body: JSON.stringify(reqBody),
    });

    const responseText = await startRes.text();
    console.log("Replicate status:", startRes.status, "response:", responseText.substring(0, 300));

    let prediction;
    try {
      prediction = JSON.parse(responseText);
    } catch (e) {
      return Response.json({ error: "Bad JSON from Replicate: " + responseText.substring(0, 200) }, { status: 500 });
    }

    if (prediction.error || prediction.title) {
      return Response.json({ error: prediction.detail || prediction.error || JSON.stringify(prediction) }, { status: 400 });
    }

    if (!prediction.id) {
      return Response.json({ error: "No ID: " + JSON.stringify(prediction) }, { status: 500 });
    }

    console.log("Prediction ID:", prediction.id);
    return Response.json({ predictionId: prediction.id, status: "starting" });

  } catch (err) {
    console.error("Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
