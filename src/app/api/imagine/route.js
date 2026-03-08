const REPLICATE_API = "https://api.replicate.com/v1/predictions";
const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;

export async function POST(request) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
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
    const fullPrompt = prompt ||
      `Interior design photo of a ${roomType || "room"} with updated ${element || "design"}. Photorealistic, professional interior photography, natural light, no people.`;

    const startRes = await fetch(REPLICATE_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496af79950fcdefaa3d10",
        input: {
          image: `data:image/jpeg;base64,${imageBase64}`,
          prompt: fullPrompt,
          prompt_strength: 0.6,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          negative_prompt: "people, text, watermark, blurry, cartoon, painting",
        },
      }),
    });

    const prediction = await startRes.json();
    if (prediction.error) {
      return Response.json({ error: prediction.error }, { status: 400 });
    }

    return Response.json({ predictionId: prediction.id, status: "starting" });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
