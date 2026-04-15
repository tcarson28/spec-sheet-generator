const {
  Document, Packer, Paragraph, Table, TableCell, TableRow,
  AlignmentType, BorderStyle, WidthType, TextRun, PageBreak,
  convertInchesToTwip, ShadingType, VerticalAlign
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

// ─── Translation ────────────────────────────────────────────────────────────

async function translateToChinese(text) {
  if (!text || text.trim() === '') return text;
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Translate the following text to Simplified Chinese. Return ONLY the translated text, no commentary:\n\n${text}`
      }]
    });
    return message.content[0].type === 'text' ? message.content[0].text : text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// ─── Table builder ───────────────────────────────────────────────────────────

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

// ─── Title section ────────────────────────────────────────────────────────────

function createTitleSection(productName, productDescription) {
  return [
    new Paragraph({
      spacing: { before: 0, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '0056A8', space: 4 } },
      children: [
        new TextRun({
          text: productName.toUpperCase() + ' \u2014 SPECIFICATION SHEET',
          font: 'Arial',
          size: 32,
          bold: true,
          color: '0056A8'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 160, after: 320 },
      children: [
        new TextRun({
          text: productDescription,
          font: 'Arial',
          size: 22,
          color: '555555'
        })
      ]
    })
  ];
}

function createSectionHeader(text) {
  return new Paragraph({
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({
        text: text,
        font: 'Arial',
        size: 24,
        bold: true,
        color: '333333'
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
      qualityAssurance, shipping
    } = JSON.parse(event.body);

    if (!productName || !productDescription) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: productName and productDescription' }) };
    }

    // Translate all fields in parallel
    console.log('Starting translations...');
    const [
      cnProductName, cnProductDescription, cnDimensions, cnMaterials,
      cnColors, cnWeight, cnStandards, cnMoq, cnLeadTime,
      cnPricingTier, cnQualityAssurance, cnShipping
    ] = await Promise.all([
      translateToChinese(productName),
      translateToChinese(productDescription),
      translateToChinese(dimensions),
      translateToChinese(materials),
      translateToChinese(colors),
      translateToChinese(weight),
      translateToChinese(standards),
      translateToChinese(moq),
      translateToChinese(leadTime),
      translateToChinese(pricingTier),
      translateToChinese(qualityAssurance),
      translateToChinese(shipping)
    ]);
    console.log('Translations complete.');

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

    // Chinese spec rows
    const cnSpecs = [
      ['尺寸', cnDimensions],
      ['材料', cnMaterials],
      colors && ['可用颜色', cnColors],
      weight && ['重量', cnWeight],
      standards && ['标准与认证', cnStandards],
      ['最小订购量（MOQ）', cnMoq],
      ['交货期', cnLeadTime],
      ['定价信息', cnPricingTier],
      qualityAssurance && ['质量保证', cnQualityAssurance],
      shipping && ['包装与运输', cnShipping]
    ].filter(Boolean);

    // Footer paragraph
    const footer = new Paragraph({
      spacing: { before: 480 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: '0056A8', space: 4 } },
      children: [
        new TextRun({ text: 'SourcePoint  \u2022  sourcepointco.com  \u2022  hello@sourcepointco.com', font: 'Arial', size: 18, color: '888888' })
      ]
    });

    // Build document — NOTE: PageBreak must be inside a Paragraph
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
          createSectionHeader('SPECIFICATION SUMMARY'),
          createSpecTable(engSpecs),
          footer,

          // Page break — MUST be inside a Paragraph
          new Paragraph({ children: [new PageBreak()] }),

          // Chinese page
          ...createTitleSection(cnProductName, cnProductDescription),
          createSectionHeader('规格说明总表'),
          createSpecTable(cnSpecs),
          new Paragraph({
            spacing: { before: 480 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: '0056A8', space: 4 } },
            children: [
              new TextRun({ text: 'SourcePoint  \u2022  sourcepointco.com  \u2022  hello@sourcepointco.com', font: 'Arial', size: 18, color: '888888' })
            ]
          })
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

    // Return base64-encoded buffer — isBase64Encoded: true is required for binary
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
