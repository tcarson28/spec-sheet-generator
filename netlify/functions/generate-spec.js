const {
  Document, Packer, Paragraph, Table, TableCell, TableRow,
  AlignmentType, BorderStyle, WidthType, TextRun, PageBreak,
  ImageRun, convertInchesToTwip, ShadingType
} = require('docx');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ─── Translation — single batched call ───────────────────────────────────────
// All fields translated in ONE API call instead of 12 separate calls.
// This keeps the function well within Netlify's 10-second timeout limit.

async function translateAllFieldsToChinese(fields) {
  // Build the list of fields that have actual content
  const toTranslate = Object.entries(fields).filter(([, v]) => v && v.trim() !== '');

  if (toTranslate.length === 0) return fields;

  // Format as a numbered list for the model to translate
  const numbered = toTranslate
    .map(([key, value], i) => `${i + 1}. [${key}]: ${value}`)
    .join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Translate each of the following items to Simplified Chinese.
Return ONLY a numbered list in exactly the same format, replacing the English text after the colon with the Chinese translation.
Keep the numbering and the [key] labels exactly as they are. Do not add any commentary.

${numbered}`
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the numbered response back into a key-value map
    const translated = { ...fields };
    const lines = responseText.split('\n').filter(l => l.trim());

    lines.forEach((line, i) => {
      // Match lines like: 1. [productName]: 翻译后的文本
      const match = line.match(/^\d+\.\s*\[([^\]]+)\]:\s*(.+)$/);
      if (match) {
        const key = match[1];
        const value = match[2].trim();
        if (key in translated) {
          translated[key] = value;
        }
      } else if (toTranslate[i]) {
        // Fallback: if parsing fails, try index-based matching
        const colonIdx = line.indexOf(']:');
        if (colonIdx !== -1) {
          const key = toTranslate[i][0];
          const value = line.slice(colonIdx + 2).trim();
          if (value) translated[key] = value;
        }
      }
    });

    return translated;
  } catch (error) {
    console.error('Batch translation error:', error.message);
    // Return originals on failure — function still completes
    return fields;
  }
}

// ─── Image helpers ────────────────────────────────────────────────────────────

function getMimeType(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return map[(mimeType || '').toLowerCase()] || 'jpg';
}

function buildImageBlock(imageBase64, imageMimeType, imagePlacement) {
  if (!imageBase64) return [];

  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const type = getMimeType(imageMimeType);

  let width, height, alignment;
  switch (imagePlacement) {
    case 'top-full':
      width = 600; height = 360;
      alignment = AlignmentType.CENTER;
      break;
    case 'top-center':
      width = 360; height = 270;
      alignment = AlignmentType.CENTER;
      break;
    case 'top-right':
      width = 280; height = 210;
      alignment = AlignmentType.RIGHT;
      break;
    default:
      width = 360; height = 270;
      alignment = AlignmentType.CENTER;
  }

  return [
    new Paragraph({
      alignment,
      spacing: { before: 160, after: 240 },
      children: [
        new ImageRun({ data: imageBuffer, transformation: { width, height }, type })
      ]
    })
  ];
}

// ─── Spec table ───────────────────────────────────────────────────────────────

function createSpecTable(specs) {
  const BLUE = '0056A8';
  const LIGHT_GRAY = 'F5F7FA';
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders = {
    top: cellBorder, bottom: cellBorder,
    left: cellBorder, right: cellBorder,
    insideHorizontal: cellBorder, insideVertical: cellBorder
  };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 3000, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: BLUE },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: 'Specification', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })]
        })]
      }),
      new TableCell({
        borders,
        width: { size: 6360, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: BLUE },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: 'Detail', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })]
        })]
      })
    ]
  });

  const dataRows = specs.map(([label, value], i) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 3000, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? LIGHT_GRAY : 'FFFFFF' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: '333333' })]
          })]
        }),
        new TableCell({
          borders,
          width: { size: 6360, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? LIGHT_GRAY : 'FFFFFF' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: value || 'N/A', font: 'Arial', size: 20, color: '333333' })]
          })]
        })
      ]
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: [headerRow, ...dataRows]
  });
}

// ─── Page sections ────────────────────────────────────────────────────────────

function createTitleSection(productName, productDescription) {
  return [
    new Paragraph({
      spacing: { before: 0, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '0056A8', space: 4 } },
      children: [
        new TextRun({
          text: productName.toUpperCase() + ' \u2014 SPECIFICATION SHEET',
          font: 'Arial', size: 32, bold: true, color: '0056A8'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 160, after: 240 },
      children: [
        new TextRun({ text: productDescription, font: 'Arial', size: 22, color: '555555' })
      ]
    })
  ];
}

function createSectionHeader(text) {
  return new Paragraph({
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: '333333' })]
  });
}

function createFooter() {
  return new Paragraph({
    spacing: { before: 480 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: '0056A8', space: 4 } },
    children: [
      new TextRun({
        text: 'SourcePoint  \u2022  sourcepointco.com  \u2022  hello@sourcepointco.com',
        font: 'Arial', size: 18, color: '888888'
      })
    ]
  });
}

// ─── Supabase archive ─────────────────────────────────────────────────────────

async function saveSpecToSupabase(specData) {
  try {
    const { error } = await supabase.from('specs').insert([{
      product_name: specData.productName,
      product_description: specData.productDescription,
      dimensions: specData.dimensions,
      materials: specData.materials,
      colors: specData.colors,
      weight: specData.weight,
      standards: specData.standards,
      moq: specData.moq,
      lead_time: specData.leadTime,
      pricing_tier: specData.pricingTier,
      quality_assurance: specData.qualityAssurance,
      shipping: specData.shipping
    }]);
    if (error) console.error('Supabase insert error:', error);
    else console.log('Spec saved to archive');
  } catch (error) {
    console.error('Archive save error:', error);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const {
      productName, productDescription, dimensions, materials,
      colors, weight, standards, moq, leadTime, pricingTier,
      qualityAssurance, shipping,
      imageBase64, imageMimeType, imagePlacement
    } = JSON.parse(event.body);

    if (!productName || !productDescription) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: productName and productDescription' })
      };
    }

    // Single batched translation call — all fields in one request
    console.log('Starting batched translation...');
    const translated = await translateAllFieldsToChinese({
      productName,
      productDescription,
      dimensions,
      materials,
      colors,
      weight,
      standards,
      moq,
      leadTime,
      pricingTier,
      qualityAssurance,
      shipping
    });
    console.log('Translation complete.');

    // English spec rows
    const engSpecs = [
      ['Dimensions', dimensions],
      ['Materials', materials],
      colors && ['Available Colors', colors],
      weight && ['Weight', weight],
      standards && ['Standards & Certifications', standards],
      ['Minimum Order Quantity (MOQ)', moq],
      ['Lead Time', leadTime],
      ['Pricing Information', pricingTier],
      qualityAssurance && ['Quality Assurance', qualityAssurance],
      shipping && ['Packaging & Shipping', shipping]
    ].filter(Boolean);

    // Chinese spec rows — using translated values
    const cnSpecs = [
      ['尺寸', translated.dimensions],
      ['材料', translated.materials],
      colors && ['可用颜色', translated.colors],
      weight && ['重量', translated.weight],
      standards && ['标准与认证', translated.standards],
      ['最小订购量（MOQ）', translated.moq],
      ['交货期', translated.leadTime],
      ['定价信息', translated.pricingTier],
      qualityAssurance && ['质量保证', translated.qualityAssurance],
      shipping && ['包装与运输', translated.shipping]
    ].filter(Boolean);

    // Image blocks (same image on both pages)
    const imageBlock = buildImageBlock(imageBase64, imageMimeType, imagePlacement);

    // Build document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75)
            }
          }
        },
        children: [
          // English page
          ...createTitleSection(productName, productDescription),
          ...imageBlock,
          createSectionHeader('SPECIFICATION SUMMARY'),
          createSpecTable(engSpecs),
          createFooter(),

          // Page break — must be inside a Paragraph
          new Paragraph({ children: [new PageBreak()] }),

          // Chinese page
          ...createTitleSection(translated.productName, translated.productDescription),
          ...imageBlock,
          createSectionHeader('规格说明总表'),
          createSpecTable(cnSpecs),
          createFooter()
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    // Archive to Supabase (non-blocking)
    saveSpecToSupabase({
      productName, productDescription, dimensions, materials,
      colors, weight, standards, moq, leadTime, pricingTier,
      qualityAssurance, shipping
    }).catch(err => console.error('Archive save failed:', err));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(productName)}_spec_sheet.docx"`,
        'Access-Control-Allow-Origin': '*'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate spec sheet', message: error.message })
    };
  }
};
