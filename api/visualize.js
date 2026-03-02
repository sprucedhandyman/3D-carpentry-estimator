export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, selections } = req.body;
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    return res.status(500).json({ error: 'Stability API key not configured' });
  }

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const prompt = buildPrompt(selections);
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Build multipart form data for the v2beta API
    const formData = new FormData();
    formData.append(
      'image',
      new Blob([imageBuffer], { type: 'image/jpeg' }),
      'kitchen.jpg'
    );
    formData.append('prompt', prompt);
    formData.append('negative_prompt', 'blurry, distorted, unrealistic, cartoon, painting, sketch, drawing, watermark, text, people, person');
    formData.append('mode', 'image-to-image');
    formData.append('strength', '0.65'); // How much to change (0=no change, 1=ignore original)
    formData.append('output_format', 'jpeg');

    // v2beta Stable Image Core endpoint (replaces deprecated SD1.6)
    const response = await fetch(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: 'application/json', // Returns base64 image in JSON response
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI error:', errorText);
      return res.status(500).json({ error: 'Visualization service error. Please try again.' });
    }

    const data = await response.json();

    // v2beta returns { image: "<base64>", finish_reason: "SUCCESS", seed: 12345 }
    if (!data.image) {
      console.error('No image in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No image returned from visualization service.' });
    }

    return res.status(200).json({ image: data.image });

  } catch (e) {
    console.error('Visualize exception:', e.message);
    return res.status(500).json({ error: 'Visualization failed. Please try again.' });
  }
}

function buildPrompt(selections = {}) {
  const parts = [
    'professional interior kitchen photography',
    'photorealistic',
    'high quality',
    '8k resolution',
    'interior design photo',
    'bright natural lighting',
  ];

  // Cabinet door style
  const doorMap = {
    flat: 'flat panel european slab cabinet doors, minimalist euro style cabinetry',
    shaker: 'shaker style cabinet doors',
    raised: 'raised panel cabinet doors, traditional cabinetry',
    glass: 'glass front upper cabinet doors',
    open: 'open shelving instead of upper cabinets, no upper cabinet doors',
  };
  if (doorMap[selections.door]) parts.push(doorMap[selections.door]);

  // Design style
  const styleMap = {
    modern: 'modern minimalist kitchen style, clean lines, sleek design',
    contemporary: 'contemporary kitchen style, current design trends',
    transitional: 'transitional kitchen style, blend of traditional and modern',
    traditional: 'traditional classic kitchen style, ornate details',
    farmhouse: 'farmhouse rustic kitchen style, cozy and inviting',
  };
  if (styleMap[selections.style]) parts.push(styleMap[selections.style]);

  // Cabinet finish
  const finishMap = {
    painted: 'painted cabinets, smooth painted finish',
    stained: 'wood stained cabinets, natural wood grain visible',
    natural: 'natural wood cabinets, unfinished wood grain',
    thermofoil: 'thermofoil cabinet finish, smooth modern surface',
    twotone: 'two-tone kitchen cabinets, contrasting upper and lower cabinet colors',
  };
  if (finishMap[selections.finish]) parts.push(finishMap[selections.finish]);

  // Box material
  if (selections.box === 'solid') parts.push('premium solid wood construction visible');
  if (selections.box === 'plywood') parts.push('quality wood construction');

  // Flooring
  const floorMap = {
    laminate: 'laminate flooring',
    lvp: 'luxury vinyl plank flooring, wood-look LVP floor',
    tile: 'porcelain tile kitchen floor',
    hardwood: 'solid hardwood wood flooring',
    existing: '',
  };
  if (floorMap[selections.flooring]) parts.push(floorMap[selections.flooring]);

  // Island
  if (selections.addIsland) {
    parts.push('large kitchen island in the center of the room, island with seating');
  }

  // Hardware
  const hardwareMap = {
    minimal: 'integrated push-to-open hardware, no visible handles',
    bar: 'sleek bar pull cabinet hardware',
    cup: 'cup pull cabinet hardware',
    knobs: 'round cabinet knobs hardware',
    mixed: 'mixed hardware, combination of pulls and knobs',
  };
  if (hardwareMap[selections.hardware]) parts.push(hardwareMap[selections.hardware]);

  return parts.filter(Boolean).join(', ');
}
