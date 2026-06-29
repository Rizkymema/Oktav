import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PptxGenJS from 'pptxgenjs';
import sharp from 'sharp';

type ArtifactType =
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'xlsx'
  | 'csv'
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'svg'
  | 'html'
  | 'zip'
  | 'md'
  | 'txt';

interface ArtifactGenerationInput {
  goal: string;
  content: string;
  outputPath: string;
  outputType: ArtifactType;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const stripMarkdown = (value: string) =>
  value
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>-]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();

const toParagraphs = (value: string) =>
  value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

const toLines = (value: string, size = 56) => {
  const words = stripMarkdown(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > size) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

const sanitizeForWinAnsi = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, '');

const createSectionedSlides = (goal: string, content: string) => {
  const sections = toParagraphs(content);
  if (sections.length === 0) {
    return [
      {
        title: goal,
        body: ['Ringkasan belum tersedia.'],
      },
    ];
  }

  return sections.slice(0, 6).map((section, index) => {
    const lines = section
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);

    return {
      title: index === 0 ? goal : lines[0] || `Bagian ${index + 1}`,
      body: (index === 0 ? lines.slice(0, 5) : lines.slice(1, 6)).filter(Boolean),
    };
  });
};

const parseCsvRows = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));

const buildHtmlDocument = (goal: string, content: string) => {
  if (content.includes('<html')) {
    return content;
  }

  const sections = toParagraphs(content);
  const body = sections
    .map((section, index) => {
      if (index === 0) {
        return `<section class="hero"><h1>${escapeHtml(goal)}</h1><p>${escapeHtml(section)}</p></section>`;
      }

      return `<section class="panel"><p>${escapeHtml(section)}</p></section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(goal)}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f0d0a;
        --panel: rgba(255,255,255,0.05);
        --border: rgba(255,255,255,0.08);
        --text: #f5f0e7;
        --muted: #b8ab99;
        --accent: #d7be96;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top, rgba(215,190,150,0.18), transparent 38%),
          linear-gradient(180deg, #16120f 0%, var(--bg) 100%);
        color: var(--text);
      }
      main {
        width: min(960px, calc(100% - 48px));
        margin: 0 auto;
        padding: 72px 0;
      }
      .hero, .panel {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 28px;
        padding: 28px;
        backdrop-filter: blur(18px);
        margin-bottom: 20px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 4vw, 3.5rem);
        line-height: 1.05;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.8;
      }
    </style>
  </head>
  <body>
    <main>
      ${body || `<section class="hero"><h1>${escapeHtml(goal)}</h1><p>Konten belum tersedia.</p></section>`}
    </main>
  </body>
</html>`;
};

const buildVisualSvg = (goal: string, content: string) => {
  const summary = toLines(content || goal, 42).slice(0, 6);
  const titleLines = toLines(goal.toUpperCase(), 18).slice(0, 2);
  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : 56}">${escapeHtml(line)}</tspan>`,
    )
    .join('');
  const summaryMarkup = summary
    .map(
      (line, index) =>
        `<text x="72" y="${330 + index * 34}" font-family="Georgia, serif" font-size="22" fill="#d9d0c1">${escapeHtml(line)}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f1710" />
      <stop offset="100%" stop-color="#090705" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0d4a9" />
      <stop offset="100%" stop-color="#b88948" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)" />
  <circle cx="980" cy="170" r="180" fill="rgba(240,212,169,0.10)" />
  <rect x="48" y="48" width="1104" height="804" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
  <rect x="72" y="84" width="184" height="12" rx="6" fill="url(#accent)" />
  <text x="72" y="180" font-family="Georgia, serif" font-size="62" font-weight="700" fill="#f6f1e7">${titleMarkup}</text>
  <text x="72" y="272" font-family="Arial, sans-serif" font-size="18" letter-spacing="4" fill="#b88948">HERMES VISUAL OUTPUT</text>
  ${summaryMarkup}
  <rect x="72" y="700" width="420" height="108" rx="26" fill="rgba(184,137,72,0.12)" stroke="rgba(240,212,169,0.18)" />
  <text x="104" y="744" font-family="Arial, sans-serif" font-size="17" fill="#f0d4a9">Generated from workspace prompt</text>
  <text x="104" y="780" font-family="Georgia, serif" font-size="24" fill="#f6f1e7">${escapeHtml(goal.slice(0, 48))}</text>
</svg>`;
};

const createPdfBytes = async (goal: string, content: string) => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const safeGoal = sanitizeForWinAnsi(goal);
  const lines = toLines(sanitizeForWinAnsi(content || goal), 82);

  page.drawText(safeGoal, {
    x: 48,
    y: 780,
    size: 20,
    font: bold,
    color: rgb(0.12, 0.12, 0.12),
  });

  lines.slice(0, 30).forEach((line, index) => {
    page.drawText(line, {
      x: 48,
      y: 742 - index * 22,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  return pdf.save();
};

const createDocxBuffer = async (goal: string, content: string) => {
  const sections = toParagraphs(content);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: goal,
            heading: HeadingLevel.TITLE,
          }),
          ...sections.flatMap((section) => [
            new Paragraph({
              children: [new TextRun(stripMarkdown(section))],
              spacing: { after: 220 },
            }),
          ]),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
};

const createPptxFile = async (goal: string, content: string, outputPath: string) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Hermes Workspace';
  pptx.company = 'AI ASSISTENT';
  pptx.subject = goal;
  pptx.title = goal;
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
  };

  const slides = createSectionedSlides(goal, content);

  slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: '11100E' };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3,
      y: 0.3,
      w: 12.7,
      h: 6.5,
      line: { color: '3D3427', transparency: 55 },
      fill: { color: index === 0 ? '1C1711' : '151210' },
    });
    slide.addText(slideData.title, {
      x: 0.7,
      y: 0.7,
      w: 8.6,
      h: 0.8,
      fontFace: 'Aptos Display',
      fontSize: index === 0 ? 28 : 24,
      bold: true,
      color: 'F5E7D0',
      margin: 0,
    });
    slide.addText(
      (slideData.body.length ? slideData.body : ['Konten belum tersedia.']).map((line) => ({
        text: line,
        options: { bullet: { indent: 14 } },
      })),
      {
        x: 0.9,
        y: 1.8,
        w: 11.1,
        h: 3.8,
        fontFace: 'Aptos',
        fontSize: 18,
        color: 'E4D5C2',
        breakLine: true,
        margin: 0.08,
        valign: 'top',
      },
    );
  });

  await pptx.writeFile({ fileName: outputPath });
};

const createWorkbookBuffer = async (goal: string, content: string) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Output');
  const rows = parseCsvRows(content);

  if (rows.length > 0) {
    rows.forEach((row) => sheet.addRow(row));
  } else {
    sheet.addRow(['Goal', goal]);
    toParagraphs(content).forEach((section, index) => {
      sheet.addRow([`Section ${index + 1}`, stripMarkdown(section)]);
    });
  }

  sheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : '';
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = Math.min(maxLength, 42);
  });

  return workbook.xlsx.writeBuffer();
};

const createZipBuffer = async (goal: string, content: string) => {
  const zip = new JSZip();
  zip.file('index.html', buildHtmlDocument(goal, content));
  zip.file('README.md', `# ${goal}\n\n${content || 'Konten belum tersedia.'}\n`);
  return zip.generateAsync({ type: 'nodebuffer' });
};

export const inferOutputTypeFromPath = (outputPath: string) =>
  path.extname(outputPath).replace(/^\./, '').toLowerCase() as ArtifactType;

export const generateImageAsset = async (input: ArtifactGenerationInput) => {
  const outputType = input.outputType === 'jpeg' ? 'jpg' : input.outputType;
  const svg = buildVisualSvg(input.goal, input.content);
  await mkdir(path.dirname(input.outputPath), { recursive: true });

  if (outputType === 'svg') {
    await writeFile(input.outputPath, svg, 'utf8');
    return;
  }

  const image = sharp(Buffer.from(svg));
  if (outputType === 'jpg') {
    await image.jpeg({ quality: 92 }).toFile(input.outputPath);
    return;
  }

  await image.png({ quality: 96 }).toFile(input.outputPath);
};

export const generateArtifactFile = async (input: ArtifactGenerationInput) => {
  await mkdir(path.dirname(input.outputPath), { recursive: true });

  switch (input.outputType) {
    case 'pdf': {
      const bytes = await createPdfBytes(input.goal, input.content);
      await writeFile(input.outputPath, Buffer.from(bytes));
      return;
    }
    case 'docx': {
      const buffer = await createDocxBuffer(input.goal, input.content);
      await writeFile(input.outputPath, buffer);
      return;
    }
    case 'pptx': {
      await createPptxFile(input.goal, input.content, input.outputPath);
      return;
    }
    case 'xlsx': {
      const buffer = await createWorkbookBuffer(input.goal, input.content);
      await writeFile(input.outputPath, Buffer.from(buffer));
      return;
    }
    case 'csv': {
      await writeFile(input.outputPath, input.content || `goal,summary\n"${input.goal}","Output belum tersedia"\n`, 'utf8');
      return;
    }
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg': {
      await generateImageAsset(input);
      return;
    }
    case 'html': {
      await writeFile(input.outputPath, buildHtmlDocument(input.goal, input.content), 'utf8');
      return;
    }
    case 'zip': {
      const buffer = await createZipBuffer(input.goal, input.content);
      await writeFile(input.outputPath, buffer);
      return;
    }
    case 'md':
    case 'txt': {
      await writeFile(input.outputPath, input.content || input.goal, 'utf8');
      return;
    }
    default: {
      await writeFile(input.outputPath, input.content || input.goal, 'utf8');
    }
  }
};

export const findExistingArtifactPath = (absolutePath: string) => existsSync(absolutePath);
