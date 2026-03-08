const REPLICATE_API = "https://api.replicate.com/v1/predictions";
const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;

export const maxDuration = 60;

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "Invalid JSON body: " + e.message }, { status: 400 });
    }

    const { imageBase64, prompt, roomType, element, pollId } = body;

    // POLL MODE
    if (pollId) {
      try {
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
          logs: pollData.logs || null,
        });
      } catch (e) {
        return Response.json({ error: "Poll failed: " + e.message }, { status: 500 });
      }
    }

    // START MODE
    if (!imageBase64) {
      return Response.json({ error: "No imageBase64 provided" }, { status: 400 });
    }

    if (!REPLICATE_TOKEN) {
      return Response.json({ error: "REPLICATE_TOKEN not set" }, { status: 500 });
    }

    const instruction = prompt || `Change the ${element || "design"} to look more modern`;

    console.log("Starting Replicate prediction, prompt:", instruction.substring(0, 100));
    console.log("Image size (chars):", imageBase64.length);

    const reqBody = {
      version: "30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
      input: {
        image: `data:image/jpeg;base64,${imageBase64}`,
        prompt: instruction,
        num_inference_steps: 50,
        image_guidance_scale: 1.5,
        guidance_scale: 7,
        negative_prompt: "people, text, watermark, blurry, low quality",
        num_outputs: 1,
      },
    };

    const startRes = await fetch(REPLICATE_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    const responseText = await startRes.text();
    console.log("Replicate response status:", startRes.status);
    console.log("Replicate response:", responseText.substring(0, 500));

    let prediction;
    try {
      prediction = JSON.parse(responseText);
    } catch (e) {
      return Response.json({ error: "Replicate returned invalid JSON: " + responseText.substring(0, 200) }, { status: 500 });
    }

    if (prediction.error) {
      return Response.json({ error: "Replicate error: " + prediction.error }, { status: 400 });
    }

    if (!prediction.id) {
      return Response.json({ error: "No prediction ID returned: " + JSON.stringify(prediction).substring(0, 200) }, { status: 500 });
    }

    console.log("Prediction started:", prediction.id);
    return Response.json({ predictionId: prediction.id, status: "starting" });

  } catch (err) {
    console.error("Unhandled error:", err);
    return Response.json({ error: "Unhandled error: " + err.message }, { status: 500 });
  }
}
