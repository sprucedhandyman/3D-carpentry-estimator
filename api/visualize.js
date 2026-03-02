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

    const formData = new FormData();
    formData.append(
      'init_image',
      new Blob([imageBuffer], { type: 'image/jpeg' }),
      'kitchen.jpg'
    );
    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append(
      'text_prompts[1][text]',
      'blurry, distorted, unrealistic, cartoon, painting, sketch, drawing, watermark, text'
    );
    formData.append('text_prompts[1][weight]', '-1');
    formData.append('image_strength', '0.40');
    formData.append('cfg_scale', '8');
    formData.append('steps', '30');
    formData.append('samples', '1');

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/image-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: 'application/json',
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

    if (!data.artifacts || !data.artifacts[0]) {
      return res.status(500).json({ error: 'No image returned from visualization service.' });
    }

    return res.status(200).json({ image: data.artifacts[0].base64 });

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
    'interior design',
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

  // Cabinet finish / color
  const finishMap = {
    painted: 'painted cabinets, smooth painted finish',
    stained: 'wood stained cabinets, natural wood grain visible',
    natural: 'natural wood cabinets, unfinished wood grain',
    thermofoil: 'thermofoil cabinet finish, smooth modern surface',
    twotone: 'two-tone kitchen cabinets, contrasting upper and lower cabinet colors',
  };
  if (finishMap[selections.finish]) parts.push(finishMap[selections.finish]);

  // Box material (subtle influence on look)
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
