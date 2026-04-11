const { Document, Packer, Paragraph, Table, TableCell, TableRow, AlignmentType, BorderStyle, WidthType, TextRun, PageBreak, UnderlineType, convertInchesToTwip, UnitsType } = require('docx');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const client = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Helper function to translate text to Chinese using Claude
async function translateToChinese(text) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate the following text to Simplified Chinese only. Return ONLY the translated text, no other commentary:\n\n${text}`
        }
      ]
    });
    
    return message.content[0].type === 'text' ? message.content[0].text : text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original if translation fails
  }
}

// Helper to create specification table rows
function createSpecTable(specs) {
  const rows = [];
  
  // Header row
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Label', bold: true })],
          shading: { fill: '0056a8', color: 'FFFFFF' },
          width: { size: 30, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Value', bold: true })],
          shading: { fill: '0056a8', color: 'FFFFFF' },
          width: { size: 70, type: WidthType.PERCENTAGE }
        })
      ]
    })
  );

  // Data rows
  specs.forEach(([label, value]) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(label)],
            shading: { fill: 'f0f0f0' }
          }),
          new TableCell({
            children: [new Paragraph(value || 'N/A')]
          })
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}

// Helper to create the title section with image
function createTitleSection(productName, productDescription, imageBase64, imageMimeType, imagePlacement) {
  const titleElements = [];
  const titleParagraph = new Paragraph({
    text: `${productName.toUpperCase()} — SPECIFICATION SHEET`,
    bold: true,
    fontSize: 28,
    color: '000000',
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 }
  });

  const descParagraph = new Paragraph({
    text: productDescription,
    fontSize: 11,
    color: '333333',
    spacing: { after: 400 }
  });

  if (imagePlacement === 'top-full' && imageBase64) {
    // Full width image at top
    titleElements.push(titleParagraph);
    titleElements.push(
      new Paragraph({
        text: '',
        border: {
          bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 }
        },
        spacing: { after: 300 }
      })
    );
    titleElements.push(descParagraph);
  } else {
    titleElements.push(titleParagraph);
    titleElements.push(descParagraph);
  }

  return titleElements;
}

// Helper function to save spec to Supabase
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

    if (error) {
      console.error('Supabase insert error:', error);
      // Don't throw - let the spec generation succeed even if archive save fails
    } else {
      console.log('Spec saved to archive successfully');
    }
  } catch (error) {
    console.error('Archive save error:', error);
    // Non-critical error - don't block the response
  }
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const {
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
      shipping,
      imagePlacement,
      imageBase64,
      imageMimeType
    } = JSON.parse(event.body);

    // Validate required fields
    if (!productName || !productDescription) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Translate all content to Chinese
    console.log('Starting translations...');
    const [
      cnProductName,
      cnProductDescription,
      cnDimensions,
      cnMaterials,
      cnColors,
      cnWeight,
      cnStandards,
      cnMoq,
      cnLeadTime,
      cnPricingTier,
      cnQualityAssurance,
      cnShipping
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

    console.log('Translations complete, building document...');

    // Convert image for embedding
    let imageObj = undefined;
    if (imageBase64) {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      imageObj = {
        data: imageBuffer,
        type: imageMimeType || 'image/jpeg'
      };
    }

    // Build English page
    const englishSections = [];
    englishSections.push(...createTitleSection(productName, productDescription, imageBase64, imageMimeType, imagePlacement));

    // Add specification sections
    englishSections.push(
      new Paragraph({
        text: 'SPECIFICATION SUMMARY TABLE',
        bold: true,
        fontSize: 14,
        color: '000000',
        spacing: { before: 300, after: 300 }
      })
    );

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

    englishSections.push(createSpecTable(engSpecs));

    // Build Chinese page
    const chineseSections = [];
    chineseSections.push(new PageBreak());
    chineseSections.push(...createTitleSection(cnProductName, cnProductDescription, imageBase64, imageMimeType, imagePlacement));

    chineseSections.push(
      new Paragraph({
        text: '规格说明总表',
        bold: true,
        fontSize: 14,
        color: '000000',
        spacing: { before: 300, after: 300 }
      })
    );

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

    chineseSections.push(createSpecTable(cnSpecs));

    // Create document
    const doc = new Document({
      sections: [{
        children: englishSections.concat(chineseSections),
        margins: {
          top: convertInchesToTwip(0.75),
          right: convertInchesToTwip(0.75),
          bottom: convertInchesToTwip(0.75),
          left: convertInchesToTwip(0.75)
        }
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Save spec to Supabase archive (non-blocking)
    saveSpecToSupabase({
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
    }).catch(err => console.error('Archive save failed:', err));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${productName}_spec_sheet.docx"`,
        'Content-Length': buffer.length.toString()
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate spec sheet',
        message: error.message
      })
    };
  }
};
