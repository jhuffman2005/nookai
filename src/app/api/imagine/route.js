const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, prompt, roomType, element, pollId } = body;

    // POLL MODE
    if (pollId) {
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${pollId}`, {
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

    if (!REPLICATE_TOKEN) {
      return Response.json({ error: "REPLICATE_TOKEN not set" }, { status: 500 });
    }

    // Build a strong interior design prompt
    const fullPrompt = prompt ||
      `A photorealistic interior design photo of a ${roomType || "room"} with ${element || "updated design"}. ` +
      `Professional real estate photography, natural light, no people, high detail.`;

    console.log("Starting FLUX Depth Pro prediction");
    console.log("Prompt:", fullPrompt.substring(0, 150));

    // FLUX Depth Pro - called by model name, no version hash needed
    const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-depth-pro/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "respond-async",
      },
      body: JSON.stringify({
        input: {
          control_image: `data:image/jpeg;base64,${imageBase64}`,
          prompt: fullPrompt,
          guidance: 15,
          strength: 0.85,
          output_format: "jpg",
          output_quality: 90,
          safety_tolerance: 2,
        },
      }),
    });

    const responseText = await startRes.text();
    console.log("Replicate HTTP status:", startRes.status);
    console.log("Replicate response:", responseText.substring(0, 400));

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
      return Response.json({ error: "No prediction ID: " + JSON.stringify(prediction).substring(0, 200) }, { status: 500 });
    }

    console.log("Prediction started:", prediction.id);
    return Response.json({ predictionId: prediction.id, status: "starting" });

  } catch (err) {
    console.error("Unhandled error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
