import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn, ZoomOut, Maximize,
  PanelLeftClose, PanelRightClose, CheckCircle2, Loader2,
  Link, Unlink, Save, RotateCw,
  FileText, AlertTriangle,
  Keyboard, List, ListOrdered, Underline,
  Italic, Bold, Eye, EyeOff, LayoutGrid, Split
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { triggerToast } from '../components/ui/ToastContainer';
import clsx from 'clsx';
import styles from './Review.module.css';
import { api } from '../lib/api';

// ── Markdown/HTML Bidirectional Converters ────────────────
function markdownToHtml(md: string): string {
  if (!md) return '';
  
  // 1. Protect low confidence spans from being escaped by replacing with a temporary token
  const confidenceSpans: string[] = [];
  let protectedMd = md.replace(/<span\s+class=["']low-confidence["']\s+data-confidence=["'](\d+)["']>(.*?)<\/span>/gi, (_match, conf, text) => {
    confidenceSpans.push(`<span class="low-confidence-highlight" style="border-bottom: 2px dashed #f59e0b; background-color: rgba(245, 158, 11, 0.08); cursor: help;" title="Confidence: ${conf}%" data-confidence="${conf}">${text}</span>`);
    return `__CONF_SPAN_${confidenceSpans.length - 1}__`;
  });

  // 2. Escape HTML special characters to avoid executing raw input HTML
  protectedMd = protectedMd
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore the protected confidence spans back into the markup
  protectedMd = protectedMd.replace(/__CONF_SPAN_(\d+)__/g, (_match, idx) => {
    return confidenceSpans[Number(idx)];
  });

  // 3. Process line-by-line for blocks
  const lines = protectedMd.split('\n');
  const result: string[] = [];
  
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableRows: string[][] = [];
  let currentParagraphText: string[] = [];

  const closeParagraph = () => {
    if (currentParagraphText.length > 0) {
      const paraText = currentParagraphText.join(' ');
      result.push(`<p>${paraText}</p>`);
      currentParagraphText = [];
    }
  };

  const closeList = () => {
    if (inList) {
      result.push(listType === 'ol' ? '</ol>' : '</ul>');
      inList = false;
      listType = null;
    }
  };

  const closeTable = () => {
    if (inTable) {
      let tableHtml = '<table border="1" style="width:100%; border-collapse:collapse; margin:12px 0;">';
      tableRows.forEach((row, rowIdx) => {
        tableHtml += '<tr>';
        row.forEach(cell => {
          const tag = rowIdx === 0 ? 'th' : 'td';
          tableHtml += `<${tag} style="padding:8px; border:1px solid var(--border);">${cell.trim()}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      result.push(tableHtml);
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeParagraph();
      closeList();
      if (trimmed.replace(/[\s|:\-]/g, '') === '') {
        continue;
      }
      inTable = true;
      const cells = trimmed.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else {
      closeTable();
    }

    // Horizontal rule / page break
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      closeParagraph();
      closeList();
      result.push('<div style="page-break-after: always; border-top: 2px dashed var(--border-strong); margin: 24px 0; text-align: center; color: var(--text-muted); font-size: 11px; user-select: none;" contenteditable="false">--- Print Page Break ---</div>');
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      closeParagraph();
      closeList();
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      result.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // Bullet List
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (bulletMatch) {
      closeParagraph();
      const text = bulletMatch[2];
      if (!inList || listType !== 'ul') {
        closeList();
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${text}</li>`);
      continue;
    }

    // Numbered List
    const numMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (numMatch) {
      closeParagraph();
      const text = numMatch[2];
      if (!inList || listType !== 'ol') {
        closeList();
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${text}</li>`);
      continue;
    }

    // Paragraph or empty line
    if (trimmed === '') {
      closeParagraph();
      closeList();
      continue;
    }

    // Standard text line
    closeList();
    
    let processedLine = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    currentParagraphText.push(processedLine);
  }

  closeParagraph();
  closeList();
  closeTable();

  return result.join('\n');
}

function structuredPageToHtml(structuredPage: any): string {
  if (!structuredPage || !structuredPage.blocks) return '';
  const blocks = structuredPage.blocks;
  
  const result: string[] = [];

  // Badge configs for element types
  const typeBadgeMap: Record<string, { label: string; color: string }> = {
    question:           { label: 'Q',         color: '#3b82f6' },
    sub_question:       { label: 'Sub-Q',     color: '#6366f1' },
    option:             { label: 'MCQ',        color: '#8b5cf6' },
    section:            { label: 'Section',    color: '#10b981' },
    subsection:         { label: 'Sub §',      color: '#14b8a6' },
    instruction:        { label: 'Instr',      color: '#f59e0b' },
    question_group:     { label: 'Group',      color: '#6b7280' },
    paragraph:          { label: 'Para',       color: '#9ca3af' },
    header:             { label: 'Header',     color: '#10b981' },
    footer:             { label: 'Footer',     color: '#9ca3af' },
    mark_allocation:    { label: 'Marks',      color: '#ef4444' },
    match_row:          { label: 'Match',      color: '#f97316' },
    table:              { label: 'Table',      color: '#0ea5e9' },
    page_break:         { label: 'Page Brk',  color: '#6b7280' },
  };

  // Question type labels
  const qTypeLabelMap: Record<string, string> = {
    fill_blank:           '✏️ Fill Blank',
    true_false:           '✅ T/F',
    assertion_reason:     '🔗 A/R',
    case_study:           '📖 Case',
    match_the_following:  '🔀 Match',
    mcq:                  '☑️ MCQ',
    diagram:              '📐 Diagram',
    programming:          '💻 Code',
    mathematical:         '📐 Math',
    long_answer:          '📝 Long',
    short_answer:         '📝 Short',
  };

  let inMatchTable = false;
  let matchTableRows: [string, string][] = [];

  const flushMatchTable = () => {
    if (!inMatchTable || matchTableRows.length === 0) { inMatchTable = false; return; }
    let html = '<table class="match-table" style="width:100%;border-collapse:collapse;margin:8px 0;">';
    html += '<thead><tr><th style="padding:6px 10px;border:1px solid var(--border);background:var(--surface-raised);text-align:left;">Column A</th><th style="padding:6px 10px;border:1px solid var(--border);background:var(--surface-raised);text-align:left;">Column B</th></tr></thead><tbody>';
    matchTableRows.forEach(([a, b]) => {
      html += `<tr><td style="padding:6px 10px;border:1px solid var(--border);">${a}</td><td style="padding:6px 10px;border:1px solid var(--border);">${b}</td></tr>`;
    });
    html += '</tbody></table>';
    result.push(html);
    inMatchTable = false;
    matchTableRows = [];
  };

  blocks.forEach((block: any) => {
    const blockType = block.type || 'question';

    // Flush match table if we're done with match rows
    if (blockType !== 'match_row' && inMatchTable) {
      flushMatchTable();
    }

    // ── Page break ──────────────────────────────────────
    if (blockType === 'page_break') {
      result.push(`<div class="explicit-page-break" data-block-id="${block.id}" style="page-break-after:always;break-after:page;border-top:1px dashed var(--border);margin:24px 0;text-align:center;color:var(--text-muted);font-size:11px;user-select:none;" contenteditable="false">--- Print Page Break ---</div>`);
      return;
    }

    // ── Match rows → accumulate into a table ───────────
    if (blockType === 'match_row') {
      inMatchTable = true;
      matchTableRows.push([block.match_column_a || block.text || '', block.match_column_b || '']);
      return;
    }

    // Clean marker from text to avoid duplication
    let rawText = block.text || '';
    const mStr = (block.marker || '').trim();
    if (mStr && rawText.trim().startsWith(mStr)) {
      rawText = rawText.trim().substring(mStr.length).trim();
    }

    // Process text with confidence span protection
    const confidenceSpans: string[] = [];
    let processedText = rawText.replace(
      /<span\s+class=["']low-confidence["']\s+data-confidence=["'](\d+)["']>(.*?)<\/span>/gi,
      (_match: string, conf: string, text: string) => {
        confidenceSpans.push(`<span class="low-confidence-highlight" style="border-bottom:2px dashed #f59e0b;background-color:rgba(245,158,11,0.08);cursor:help;" title="Confidence: ${conf}%" data-confidence="${conf}">${text}</span>`);
        return `__CONF_SPAN_${confidenceSpans.length - 1}__`;
      }
    );

    // Escape HTML
    processedText = processedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Restore spans
    processedText = processedText.replace(/__CONF_SPAN_(\d+)__/g, (_match: string, idx: string) => confidenceSpans[Number(idx)]);

    // Inline markdown
    processedText = processedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Fill-blank underscores → styled blanks
    if (block.has_fill_blank) {
      processedText = processedText.replace(/_{3,}/g, '<span style="display:inline-block;min-width:60px;border-bottom:2px solid currentColor;"> </span>');
    }

    // Inline boxes
    processedText = processedText
      .replace(/\[BOX\]/g, '<span class="inline-box" contenteditable="false"></span>')
      .replace(/\[CHECKBOX\]/g, '<span class="inline-checkbox" contenteditable="false"></span>');

    // Build badges
    const badgeConf = typeBadgeMap[blockType];
    const badge = badgeConf
      ? `<span class="el-type-badge" style="display:inline-block;font-size:10px;font-weight:600;padding:1px 5px;border-radius:3px;margin-right:6px;background:${badgeConf.color}22;color:${badgeConf.color};border:1px solid ${badgeConf.color}44;user-select:none;vertical-align:middle;">${badgeConf.label}</span>`
      : '';

    // Question type pill
    const qtLabel = block.question_type ? qTypeLabelMap[block.question_type] : null;
    const qtBadge = qtLabel
      ? `<span class="qt-badge" style="display:inline-block;font-size:10px;padding:1px 5px;border-radius:10px;margin-right:6px;background:rgba(99,102,241,0.12);color:#6366f1;user-select:none;vertical-align:middle;">${qtLabel}</span>`
      : '';

    // Marker
    const marker = block.marker ? `<span class="marker" style="font-weight:700;margin-right:6px;color:var(--text-primary);">${block.marker}</span>` : '';

    // Marks allocation
    const marksRaw = block.marks?.raw || (typeof block.marks === 'string' ? block.marks : null);
    let cleanMarks = marksRaw ? marksRaw.trim() : '';
    while (cleanMarks.startsWith('[') && cleanMarks.endsWith(']')) {
      cleanMarks = cleanMarks.slice(1, -1).trim();
    }
    while (cleanMarks.startsWith('(') && cleanMarks.endsWith(')')) {
      cleanMarks = cleanMarks.slice(1, -1).trim();
    }
    const marksHtml = cleanMarks
      ? `<span class="marks" style="float:right;font-size:11px;font-weight:600;color:var(--accent);background:rgba(59,130,246,0.1);padding:2px 6px;border-radius:4px;margin-left:8px;">[${cleanMarks}]</span>`
      : '';

    // Hierarchy indentation
    const level = block.hierarchy_level || 0;
    const indent = level > 0 ? `padding-left: ${level * 24}px;` : '';

    // ── Render by type ──────────────────────────────────
    if (blockType === 'section') {
      result.push(`<h1 data-block-id="${block.id}">${badge}${processedText}</h1>`);
    } else if (blockType === 'subsection') {
      result.push(`<h2 data-block-id="${block.id}">${badge}${processedText}</h2>`);
    } else if (blockType === 'header') {
      result.push(`<p class="header-line" data-block-id="${block.id}" style="font-weight:600;border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:4px;">${badge}${processedText}</p>`);
    } else if (blockType === 'footer') {
      result.push(`<p class="footer-line" data-block-id="${block.id}" style="font-size:11px;color:var(--text-muted);border-top:1px solid var(--border);padding-top:4px;">${badge}${processedText}</p>`);
    } else if (blockType === 'instruction') {
      result.push(`<p class="instruction" data-block-id="${block.id}" style="font-style:italic;color:var(--text-muted);${indent}">${badge}${processedText}</p>`);
    } else if (blockType === 'question' || blockType === 'question_group') {
      result.push(`<p class="question" data-block-id="${block.id}" style="${indent}">${marksHtml}${badge}${qtBadge}${marker}<span>${processedText}</span></p>`);
    } else if (blockType === 'sub_question') {
      result.push(`<p class="question sub-question" data-block-id="${block.id}" style="${indent}">${marksHtml}${badge}${qtBadge}${marker}<span>${processedText}</span></p>`);
    } else if (blockType === 'option') {
      result.push(`<p class="option" data-block-id="${block.id}" style="${indent || 'padding-left:24px;'}">${badge}${marker}<span>${processedText}</span></p>`);
    } else if (blockType === 'mark_allocation') {
      result.push(`<p class="mark-allocation" data-block-id="${block.id}" style="text-align:right;font-size:12px;font-weight:600;color:var(--accent);">${badge}${processedText}</p>`);
    } else if (blockType === 'table' && block.table?.rows) {
      let tableHtml = `<table border="1" data-block-id="${block.id}" style="width:100%;border-collapse:collapse;margin:12px 0;">`;
      block.table.rows.forEach((row: any, rowIdx: number) => {
        tableHtml += '<tr>';
        (row.cells || []).forEach((cell: any) => {
          const tag = cell.header || rowIdx === 0 ? 'th' : 'td';
          tableHtml += `<${tag} style="padding:8px;border:1px solid var(--border);">${cell.text || ''}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      result.push(tableHtml);
    } else if (blockType === 'match_following' && block.match_pairs) {
      let tableHtml = `<table class="match-table" data-block-id="${block.id}" style="width:100%;border-collapse:collapse;margin:12px 0;"><tbody>`;
      block.match_pairs.forEach((pair: any) => {
        tableHtml += `<tr><td style="padding:8px;border:1px solid var(--border);">${pair.left||''}</td><td style="padding:8px;border:1px solid var(--border);">${pair.right||''}</td></tr>`;
      });
      tableHtml += '</tbody></table>';
      result.push(tableHtml);
    } else if (blockType === 'shape') {
      const shapeType = (block.content || block.text || '').toLowerCase();
      const shapeSize = (block.size || 'medium').toLowerCase();
      const shapeClassType = shapeType === 'box' ? 'rectangle' : shapeType;
      result.push(`<div class="shape-container" data-block-id="${block.id}" style="margin:16px 0;display:flex;justify-content:center;">
        <div class="shape-element shape-type-${shapeClassType} shape-size-${shapeSize}" title="${shapeType} (${shapeSize})" contenteditable="false"></div>
      </div>`);
    } else {
      result.push(`<p data-block-id="${block.id}" style="${indent}">${badge}${processedText}</p>`);
    }
  });

  // Flush any remaining match table
  flushMatchTable();
  
  return result.join('\n');
}

function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const convertNode = (node: Node): string => {
    let markdown = '';
    
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        markdown += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tagName = el.tagName.toUpperCase();
        
        if (tagName === 'H1') {
          markdown += `\n# ${convertNode(el).trim()}\n\n`;
        } else if (tagName === 'H2') {
          markdown += `\n## ${convertNode(el).trim()}\n\n`;
        } else if (tagName === 'H3') {
          markdown += `\n### ${convertNode(el).trim()}\n\n`;
        } else if (tagName === 'P') {
          if (el.classList.contains('instruction')) {
            markdown += `\n*${convertNode(el).trim()}*\n\n`;
          } else {
            markdown += `${convertNode(el).trim()}\n\n`;
          }
        } else if (tagName === 'UL') {
          el.querySelectorAll(':scope > li').forEach(li => {
            markdown += `* ${convertNode(li).trim()}\n`;
          });
          markdown += '\n';
        } else if (tagName === 'OL') {
          el.querySelectorAll(':scope > li').forEach((li, idx) => {
            markdown += `${idx + 1}. ${convertNode(li).trim()}\n`;
          });
          markdown += '\n';
        } else if (tagName === 'BR') {
          markdown += '\n';
        } else if (tagName === 'TABLE') {
          const rows = el.querySelectorAll('tr');
          rows.forEach((row, rowIdx) => {
            const cells = row.querySelectorAll('th, td');
            const cellTexts = Array.from(cells).map(cell => convertNode(cell).trim());
            markdown += `| ${cellTexts.join(' | ')} |\n`;
            if (rowIdx === 0) {
              markdown += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
            }
          });
          markdown += '\n';
        } else if (tagName === 'SPAN') {
          const confidence = el.getAttribute('data-confidence');
          if (confidence) {
            markdown += `<span class="low-confidence" data-confidence="${confidence}">${convertNode(el)}</span>`;
          } else {
            markdown += convertNode(el);
          }
        } else if (tagName === 'DIV') {
          if (el.classList.contains('explicit-page-break')) {
            markdown += '\n---\n';
          } else {
            markdown += `${convertNode(el).trim()}\n\n`;
          }
        } else if (tagName === 'STRONG') {
          if (el.classList.contains('marks')) {
            markdown += convertNode(el);
          } else {
            markdown += `**${convertNode(el)}**`;
          }
        } else if (tagName === 'EM') {
          markdown += `*${convertNode(el)}*`;
        } else {
          markdown += convertNode(el);
        }
      }
    });
    
    return markdown;
  };
  
  let md = convertNode(tempDiv);
  
  // Normalize consecutive newlines
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

function cleanLoadedHtml(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const questions = doc.querySelectorAll('p.question');
  questions.forEach((q) => {
    const markerEl = q.querySelector('.marker');
    const marksEl = q.querySelector('.marks');

    if (markerEl) {
      const markerText = (markerEl.textContent || '').trim();
      if (markerText) {
        const textSpan = q.querySelector('span:not(.marker):not(.marks):not(.el-type-badge):not(.qt-badge)');
        if (textSpan) {
          const spanText = textSpan.textContent || '';
          if (spanText.trim().startsWith(markerText)) {
            const cleanText = spanText.trim().substring(markerText.length).trim();
            textSpan.textContent = cleanText;
          }
        }
      }
    }

    if (marksEl) {
      let marksText = (marksEl.textContent || '').trim();
      while (marksText.startsWith('[') && marksText.endsWith(']')) {
        marksText = marksText.slice(1, -1).trim();
      }
      while (marksText.startsWith('(') && marksText.endsWith(')')) {
        marksText = marksText.slice(1, -1).trim();
      }
      if (marksText) {
        marksEl.textContent = `[${marksText}]`;
      } else {
        marksEl.remove();
      }
    }
  });

  return doc.body.innerHTML;
}

function htmlToBlocks(html: string, existingBlocks: any[] = []): any[] {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const blocks: any[] = [];
  const existingMap = new Map(existingBlocks.map(b => [b.id, b]));
  
  tempDiv.childNodes.forEach(child => {
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tagName = el.tagName.toUpperCase();
    const blockId = el.getAttribute('data-block-id') || Math.random().toString(36).substring(7);
    const existing = existingMap.get(blockId);
    
    let type = 'question';
    let text = '';
    let marker = el.querySelector('.marker')?.textContent || existing?.marker || null;
    let marks = el.querySelector('.marks')?.textContent || existing?.marks?.raw || existing?.marks || null;
    
    // Extract text safely by removing all non-editable UI elements first
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.marker, .marks, .el-type-badge, .qt-badge').forEach(n => n.remove());
    const cleanText = clone.textContent || '';
    
    if (tagName === 'H1') {
      type = 'section';
      text = cleanText;
    } else if (tagName === 'H2') {
      type = 'subsection';
      text = cleanText;
    } else if (tagName === 'H3') {
      type = 'heading';
      text = cleanText;
    } else if (tagName === 'P') {
      if (el.classList.contains('instruction')) {
        type = 'instruction';
        text = cleanText;
      } else if (el.classList.contains('option')) {
        type = 'option';
        text = cleanText;
      } else if (el.classList.contains('mark-allocation')) {
        type = 'mark_allocation';
        text = cleanText;
      } else if (el.classList.contains('sub-question')) {
        type = 'sub_question';
        text = cleanText;
      } else if (el.classList.contains('footer-line')) {
        type = 'footer';
        text = cleanText;
      } else if (el.classList.contains('header-line')) {
        type = 'header';
        text = cleanText;
      } else {
        type = existing?.type || 'question';
        text = cleanText;
      }
    } else if (tagName === 'TABLE') {
      if (el.classList.contains('match-table')) {
        type = 'match_following';
        const match_pairs: any[] = [];
        el.querySelectorAll('tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            match_pairs.push({
              left: cells[0].textContent?.trim() || '',
              right: cells[1].textContent?.trim() || ''
            });
          }
        });
        blocks.push({
          id: blockId,
          type,
          match_pairs,
          confidence: existing?.confidence ?? 0.95
        });
        return;
      } else {
        type = 'table';
        const rows: any[] = [];
        el.querySelectorAll('tr').forEach(row => {
          const cells: any[] = [];
          row.querySelectorAll('th, td').forEach(cell => {
            cells.push({
              text: cell.textContent?.trim() || '',
              header: cell.tagName.toUpperCase() === 'TH'
            });
          });
          rows.push({ cells });
        });
        blocks.push({
          id: blockId,
          type,
          table: { rows },
          confidence: existing?.confidence ?? 0.95
        });
        return;
      }
    } else if (el.classList.contains('explicit-page-break')) {
      type = 'page_break';
      blocks.push({
        id: blockId,
        type,
        confidence: 1.0
      });
      return;
    } else {
      type = existing?.type || 'question';
      text = el.textContent || '';
    }
    
    // Clean text: strip any leading/trailing marker/marks text if it accidentally leaked in
    text = text.trim();
    if (marker && text.startsWith(marker)) {
      text = text.substring(marker.length).trim();
    }
    if (marks && text.endsWith(marks)) {
      text = text.substring(0, text.length - marks.length).trim();
    }
    
    blocks.push({
      id: blockId,
      type,
      text,
      confidence: existing?.confidence ?? 0.95,
      marker: marker || null,
      marks: typeof marks === 'string' ? { raw: marks } : (existing?.marks || null)
    });
  });
  
  return blocks;
}


interface TokenInfo {
  word: string;
  confidence: number;
}

interface ConfidenceMetrics {
  averageConfidence: number;
  lowestConfidence: number;
  highlightedWords: number;
  warnings: number;
  reviewPercentage: number;
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
}

function analyzeHtmlConfidence(html: string): ConfidenceMetrics {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'li', 'td', 'th'];
  const blocks: HTMLElement[] = [];
  
  const traverse = (node: HTMLElement) => {
    let hasBlockChild = false;
    Array.from(node.children).forEach((child: any) => {
      if (blockTags.includes(child.tagName.toLowerCase())) {
        hasBlockChild = true;
        traverse(child);
      }
    });
    if (!hasBlockChild && (blockTags.includes(node.tagName.toLowerCase()) || node === temp)) {
      blocks.push(node);
    }
  };
  traverse(temp);

  const blockConfidences: number[] = [];
  let lowestTokenConf = 1.0;
  let totalTokensCount = 0;
  let mediumTokensCount = 0;
  let lowTokensCount = 0;
  let highlightedWordsCount = 0;

  const distribution = { high: 0, medium: 0, low: 0 };

  blocks.forEach(block => {
    const tokens: TokenInfo[] = [];

    const parseNodes = (n: Node) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const text = n.textContent || '';
        const words = text.split(/\s+/).filter(w => w.trim());
        words.forEach(w => {
          tokens.push({ word: w, confidence: 0.98 });
        });
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement;
        if (el.classList.contains('low-confidence-highlight')) {
          const confAttr = el.getAttribute('data-confidence');
          const confidence = confAttr ? parseInt(confAttr) / 100 : 0.70;
          const text = el.textContent || '';
          const words = text.split(/\s+/).filter(w => w.trim());
          words.forEach(w => {
            tokens.push({ word: w, confidence });
          });
        } else {
          Array.from(el.childNodes).forEach(parseNodes);
        }
      }
    };

    Array.from(block.childNodes).forEach(parseNodes);

    if (tokens.length === 0) {
      blockConfidences.push(0.98);
      return;
    }

    let blockSum = 0;
    tokens.forEach(t => {
      blockSum += t.confidence;
      totalTokensCount++;
      if (t.confidence < lowestTokenConf) {
        lowestTokenConf = t.confidence;
      }
      if (t.confidence < 0.80) {
        lowTokensCount++;
        highlightedWordsCount++;
        distribution.low++;
      } else if (t.confidence < 0.95) {
        mediumTokensCount++;
        highlightedWordsCount++;
        distribution.medium++;
      } else {
        distribution.high++;
      }
    });

    blockConfidences.push(blockSum / tokens.length);
  });

  const pageAvgConfidence = blockConfidences.length > 0
    ? blockConfidences.reduce((a, b) => a + b, 0) / blockConfidences.length
    : 0.98;

  const reviewPct = totalTokensCount > 0
    ? ((mediumTokensCount + lowTokensCount) / totalTokensCount) * 100
    : 0;

  return {
    averageConfidence: pageAvgConfidence,
    lowestConfidence: lowestTokenConf,
    highlightedWords: highlightedWordsCount,
    warnings: lowTokensCount,
    reviewPercentage: reviewPct,
    distribution
  };
}

// ── Smart Image / PDF Preview ─────────────────────────────
// Browsers don't send auth headers for <img src> or <iframe src>.
// Solution: fetch the file as a blob WITH the token, then hand the
// browser a local object URL it can display without any auth.
interface PreviewProps {
  src: string;
  zoom: number;
  rotation: number;
  brightness: number;
  contrast: number;
  pageNum: number;
}

const ImageOrPdfPreview: React.FC<PreviewProps> = ({ src, zoom, rotation, brightness, contrast, pageNum }) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [mimeType, setMimeType]   = React.useState<string | null>(null);
  const [error, setError]         = React.useState(false);

  React.useEffect(() => {
    let revoked = false;
    setObjectUrl(null);
    setMimeType(null);
    setError(false);

    const token = localStorage.getItem('titus_auth_token');
    const baseURL = import.meta.env.VITE_API_URL || '';
    const fullSrc = src.startsWith('/api/') ? `${baseURL}${src}` : src;

    fetch(fullSrc, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}`);
        const ct = r.headers.get('content-type') || 'image/png';
        const blob = await r.blob();
        if (!revoked) {
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
          setMimeType(ct);
        }
      })
      .catch(() => {
        if (!revoked) setError(true);
      });

    // Cleanup object URL when src changes or component unmounts
    return () => {
      revoked = true;
      setObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [src]);

  if (error) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>
        <FileText size={32} style={{ marginBottom: 8 }} />
        <div>Could not load preview.</div>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Loader2 size={16} className="animate-spin" /> Loading preview…
      </div>
    );
  }

  if (mimeType?.includes('pdf')) {
    return (
      <iframe
        src={`${objectUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        title={`Page ${pageNum}`}
        style={{
          width: `${Math.max(400, zoom * 6)}px`,
          height: `${Math.max(560, zoom * 8)}px`,
          border: 'none',
          transform: `rotate(${rotation}deg)`,
          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          transformOrigin: 'top center',
          background: '#fff',
          display: 'block',
        }}
      />
    );
  }

  return (
    <img
      src={objectUrl}
      alt={`Page ${pageNum}`}
      style={{
        maxWidth: '100%',
        display: 'block',
        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
        transformOrigin: 'top center',
      }}
    />
  );
};

const ThumbnailWithAuth: React.FC<{ src: string; className?: string; alt?: string; style?: React.CSSProperties }> = ({ src, className, alt, style }) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let revoked = false;
    const token = localStorage.getItem('titus_auth_token');
    const baseURL = import.meta.env.VITE_API_URL || '';
    const fullSrc = src.startsWith('/api/') ? `${baseURL}${src}` : src;

    fetch(fullSrc, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async r => {
        if (!r.ok) return;
        const blob = await r.blob();
        if (!revoked) setObjectUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!objectUrl) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <Loader2 size={14} className="animate-spin" />
      </div>
    );
  }
  return <img src={objectUrl} className={className} alt={alt} style={style} />;
};

export const Review: React.FC = () => {
  const navigate = useNavigate();

  // Layout & Toolbar State
  const [thumbCollapsed, setThumbCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(48); // % of center area
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [syncScroll, setSyncScroll] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Interactive Elements Sync
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Developer Mode & Tabs State
  const [isDevMode, setIsDevMode] = useState(false);
  const [devTab, setDevTab] = useState<'model' | 'markdown' | 'json' | 'source'>('model');

  // Data state
  const [job, setJob] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [activePageNum, setActivePageNum] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'Saving...' | 'Saved' | 'Changes Auto Saved'>('Changes Auto Saved');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ConfidenceMetrics>({
    averageConfidence: 0.98,
    lowestConfidence: 1.0,
    highlightedWords: 0,
    warnings: 0,
    reviewPercentage: 0,
    distribution: { high: 0, medium: 0, low: 0 }
  });

  // Refs
  const workspaceRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isScrollingLeft = useRef(false);
  const isScrollingRight = useRef(false);
  // Track whether the user has made edits to the current page —
  // prevents the useEffect from wiping their changes on re-render.
  const isDirty = useRef(false);
  // Track which page is currently loaded in the editor.
  const editorLoadedPage = useRef<number | null>(null);
  // Auto-save debounce timer.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jobId = localStorage.getItem('active_job_id');

  // ── Fetch Job Data ──────────────────────────────────────
  useEffect(() => {
    if (!jobId) { triggerToast('error', 'Error', 'No active job.'); navigate('/'); return; }

    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await api.get<any>(`/jobs/${jobId}`);
        setJob(data);
        setPages(data.pages || []);
        if (data.pages?.length > 0) setActivePageNum(data.pages[0].page_number);
      } catch (err: any) {
        triggerToast('error', 'Error', err.message);
        navigate('/');
      } finally { setLoading(false); }
    };
    fetchJob();
  }, [jobId]);

  const activePage = pages.find(p => p.page_number === activePageNum);

  // ── Load active page into editor ─────────────────────────
  // Only re-initialize the editor when we switch to a different page,
  // never while the user is editing the current page (isDirty guard).
  useEffect(() => {
    if (!activePage) return;

    const structuredPage = ensureStructuredPage(activePage);
    const rawHtml = activePage.edited_html || structuredPageToHtml(structuredPage);
    const htmlToLoad = cleanLoadedHtml(rawHtml);

    // Always update metrics.
    setMetrics(analyzeHtmlConfidence(htmlToLoad));

    // Only write innerHTML when we switch pages or if the editor is unpopulated.
    const pageSwitched = editorLoadedPage.current !== activePage.page_number;
    if (editorRef.current && (pageSwitched || !editorLoadedPage.current || (!isDirty.current && !editorRef.current.innerHTML))) {
      editorRef.current.innerHTML = htmlToLoad;
      editorLoadedPage.current = activePage.page_number;
      isDirty.current = false;
    }
  }, [activePageNum, loading]);

  // ── Synced scrolling ────────────────────────────────────
  useEffect(() => {
    const leftEl  = leftScrollRef.current;
    const rightEl = rightScrollRef.current;
    if (!leftEl || !rightEl || !syncScroll) return;

    const onLeft = () => {
      if (isScrollingRight.current) return;
      isScrollingLeft.current = true;
      rightEl.scrollTop = leftEl.scrollTop;
      isScrollingLeft.current = false;
    };
    const onRight = () => {
      if (isScrollingLeft.current) return;
      isScrollingRight.current = true;
      leftEl.scrollTop = rightEl.scrollTop;
      isScrollingRight.current = false;
    };
    leftEl.addEventListener('scroll', onLeft);
    rightEl.addEventListener('scroll', onRight);
    return () => {
      leftEl.removeEventListener('scroll', onLeft);
      rightEl.removeEventListener('scroll', onRight);
    };
  }, [syncScroll, activePageNum, devTab]);

  const handleManualSave = async () => {
    setSaveStatus('Saving...');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // syncEditorContent already calls triggerSave internally
    // but we call it and await so we can show the toast after
    const rawHtml = editorRef.current?.innerHTML || '';
    // Clean before saving: strip doubled markers and double-bracketed marks
    const html = cleanLoadedHtml(rawHtml);
    if (!activePage) return;
    const updatedPage = {
      ...activePage,
      edited_html: html,
    };
    await triggerSave(updatedPage);
    setSaveStatus('Saved');
    triggerToast('success', 'Changes Saved', 'Your edits were saved successfully.');
  };

  // ── Keyboard Shortcuts (ctrl+s, ctrl+z, ctrl+shift+z, alt+left, alt+right) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
      // Alt + Right (Next page)
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (activePageNum < pages.length) {
          if (isDirty.current) { if (saveTimer.current) clearTimeout(saveTimer.current); syncEditorContent(); }
          setActivePageNum(n => n + 1);
        }
      }
      // Alt + Left (Previous page)
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activePageNum > 1) {
          if (isDirty.current) { if (saveTimer.current) clearTimeout(saveTimer.current); syncEditorContent(); }
          setActivePageNum(n => n - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePageNum, pages]);

  const triggerSave = async (pageOverride?: any) => {
    const pageToSave = pageOverride || activePage;
    if (!pageToSave) return;
    const structuredPage = pageToSave.structured_page || null;

    // Always read HTML directly from the editor DOM - this is the source of truth.
    // Fall back to what was passed in pageOverride (e.g. from syncEditorContent),
    // then to anything previously saved.
    const currentHtml =
      editorRef.current?.innerHTML ||
      pageToSave.edited_html ||
      '';

    // Safety check: preserve elements if empty
    const elementsToSend = (pageToSave.elements && pageToSave.elements.length > 0)
      ? pageToSave.elements
      : (activePage?.elements || []);

    if (!currentHtml && elementsToSend.length === 0) {
      // Nothing to save – skip to avoid wiping the DB
      return;
    }

    try {
      await api.put(`/jobs/${jobId}/pages/${pageToSave.page_number}`, {
        markdown: pageToSave.markdown || '',
        elements: elementsToSend,
        structured_page: structuredPage,
        edited_html: currentHtml,
      });
      setSaveStatus('Saved');
      setPages(prev =>
        prev.map(p =>
          p.page_number === pageToSave.page_number
            ? { ...p, elements: elementsToSend, edited_html: currentHtml }
            : p
        )
      );
    } catch {
      setSaveStatus('Changes Auto Saved');
    }
  };

  const ensureStructuredPage = (page: any) => {
    if (page?.structured_page) return page.structured_page;
    return {
      page_number: page?.page_number || activePageNum,
      status: page?.status || 'completed',
      image_url: page?.image_url || null,
      blocks: page?.elements || [],
    };
  };

  const updateModelBlock = (blockId: string | null | undefined, patch: Record<string, any>) => {
    if (!activePage || !blockId) return;
    const structuredPage = ensureStructuredPage(activePage);
    const updatedBlocks = (structuredPage.blocks || []).map((block: any) => {
      if (block.id !== blockId) return block;
      return { ...block, ...patch };
    });
    const updatedElements = (activePage.elements || []).map((element: any) => {
      if (element.id !== blockId) return element;
      const next = { ...element };
      if (typeof patch.text === 'string') {
        next.text = patch.text;
        next.raw_text = patch.text;
      }
      if ('marks' in patch) {
        next.mark_allocation = patch.marks?.raw || '';
      }
      return next;
    });
    const updatedPage = {
      ...activePage,
      elements: updatedElements,
      structured_page: {
        ...structuredPage,
        blocks: updatedBlocks,
      },
    };
    setPages(prev =>
      prev.map(p => p.page_number === activePage.page_number ? updatedPage : p)
    );
    triggerSave(updatedPage);
  };


  const syncEditorContent = (forceActivePage?: any) => {
    const page = forceActivePage || activePage;
    if (!editorRef.current || !page) return null;

    const html = editorRef.current.innerHTML;
    // Clean before saving: strip doubled markers ("7. 7. ...") and double brackets ("[[x]]") 
    const cleanedHtml = cleanLoadedHtml(html);
    const updatedMarkdown = htmlToMarkdown(cleanedHtml);

    // Parse HTML to blocks
    const existingBlocks = page.structured_page?.blocks || page.elements || [];
    const updatedBlocks = htmlToBlocks(cleanedHtml, existingBlocks);

    // Update live metrics.
    setMetrics(analyzeHtmlConfidence(cleanedHtml));

    // CRITICAL: include edited_html so it is saved and used in HTML download
    const updatedPage = {
      ...page,
      markdown: updatedMarkdown,
      elements: updatedBlocks,
      edited_html: cleanedHtml,
      structured_page: {
        ...ensureStructuredPage(page),
        blocks: updatedBlocks
      }
    };

    setPages(prev =>
      prev.map(p => p.page_number === page.page_number ? updatedPage : p)
    );

    triggerSave(updatedPage);
    return updatedPage;
  };

  // Debounced auto-save triggered by user input in the editor.
  const handleEditorInput = () => {
    isDirty.current = true;
    setSaveStatus('Saving...');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      syncEditorContent();
    }, 1200); // save 1.2 s after the user stops typing
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const blockEl = target.closest('[data-block-id]');
    if (blockEl) {
      const blockId = blockEl.getAttribute('data-block-id');
      if (blockId) {
        setSelectedElementId(blockId);
      }
    }
  };

  // ── Divider Drag Resize ──────────────────────────────────
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX  = e.clientX;
    const startPct = leftWidth;
    const container = workspaceRef.current;
    if (!container) return;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const totalW = container.clientWidth - (thumbCollapsed ? 0 : 168) - (inspectorCollapsed ? 0 : 256);
      const newPct = Math.min(85, Math.max(20, startPct + (dx / totalW) * 100));
      setLeftWidth(newPct);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Complete Review ──────────────────────────────────────
  const handleFinish = async () => {
    if (!jobId) {
      triggerToast('error', 'Error', 'No active job.');
      return;
    }

    try {
      setSaveStatus('Saving...');
      // Cancel any pending debounced save and flush immediately.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      syncEditorContent();
      if (activePage) await triggerSave(activePage);

      setSaveStatus('Saved');
      triggerToast('success', 'Review Completed', `Structuring document...`);

      // Mark complete and structure
      await api.post(`/jobs/${jobId}/complete`);
      navigate('/success');
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Failed to complete review.');
    }
  };

  // ── Text Format Actions ──────────────────────────────────
  const execFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    syncEditorContent();
  };

  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="width:100%; border-collapse:collapse; margin:12px 0;">
        <thead>
          <tr>
            <th style="padding:8px; border:1px solid var(--border);">Header</th>
            <th style="padding:8px; border:1px solid var(--border);">Header</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px; border:1px solid var(--border);">Data</td>
            <td style="padding:8px; border:1px solid var(--border);">Data</td>
          </tr>
        </tbody>
      </table>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    syncEditorContent();
  };

  const insertPageBreak = () => {
    const pbHtml = '<div class="explicit-page-break" style="page-break-after: always; break-after: page; border-top: 1px dashed var(--border); margin: 24px 0; text-align: center; color: var(--text-muted); font-size: 11px; user-select: none;" contenteditable="false">--- Print Page Break ---</div>';
    document.execCommand('insertHTML', false, pbHtml);
    syncEditorContent();
  };

  // ── Document & Page Metrics calculations ─────────────────
  const activeStructuredPage = ensureStructuredPage(activePage);
  const activeBlocks = activeStructuredPage?.blocks || [];
  const activeElements = activePage?.elements || [];
  
  const pageMetricsList = pages.map(p => {
    const structuredPage = ensureStructuredPage(p);
    const text = (structuredPage?.blocks || []).map((block: any) => block.text || '').join('\n');
    const html = markdownToHtml(text || p.markdown || '');
    return analyzeHtmlConfidence(html);
  });

  const docAvgConfidence = pageMetricsList.length > 0
    ? pageMetricsList.reduce((acc, cur) => acc + cur.averageConfidence, 0) / pageMetricsList.length
    : 0.98;

  const docTotalWarnings = pageMetricsList.reduce((acc, cur) => acc + cur.warnings, 0);

  // Selected model block for Inspector
  const selectedElement = activeBlocks.find((e: any) => e.id === selectedElementId) || activeBlocks[0];
  const selectedConfidence = selectedElement?.source?.ocr_confidence ?? selectedElement?.confidence ?? 1.0;


  if (loading) {
    return (
      <div className={styles.workspace} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Loading workstation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspace} ref={workspaceRef}>

      {/* ── LEFT — Thumbnail list / Navigation / Page metrics ── */}
      <div className={clsx(styles.thumbPanel, thumbCollapsed && styles.collapsed)}>
        <div className={styles.thumbPanelHeader}>
          <span className={styles.thumbPanelTitle}>Pages ({pages.length})</span>
          <button className={styles.paneBtn} onClick={() => setThumbCollapsed(true)}><PanelLeftClose size={14} /></button>
        </div>
        
        {/* Document Stats Overview */}
        <div className={styles.docStatsSummary}>
          <div className={styles.statMiniCard}>
            <span className={styles.statMiniLabel}>Doc Accuracy</span>
            <strong className={styles.statMiniVal} style={{ color: docAvgConfidence >= 0.85 ? 'var(--success)' : 'var(--warning)' }}>
              {Math.round(docAvgConfidence * 100)}%
            </strong>
          </div>
          <div className={styles.statMiniCard}>
            <span className={styles.statMiniLabel}>Total Warnings</span>
            <strong className={styles.statMiniVal} style={{ color: docTotalWarnings > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {docTotalWarnings}
            </strong>
          </div>
        </div>

        <div className={styles.thumbList}>
          {pages.map(p => {
            const isNearActive = Math.abs(p.page_number - activePageNum) <= 8;
            const pageIndex = pages.findIndex(x => x.page_number === p.page_number);
            const pageMetrics = pageMetricsList[pageIndex] || { averageConfidence: 0.98 };

            return (
              <div
                key={p.page_number}
                className={clsx(styles.thumbItem, p.page_number === activePageNum && styles.active)}
                onClick={() => {
                  // Flush any pending edit-save before switching pages.
                  if (isDirty.current) {
                    if (saveTimer.current) clearTimeout(saveTimer.current);
                    syncEditorContent();
                  }
                  setActivePageNum(p.page_number);
                }}
              >
                {isNearActive ? (
                  p.image_url ? (
                    <ThumbnailWithAuth src={p.image_url} className={styles.thumbImg} alt={`Page ${p.page_number}`} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>
                      <FileText size={20} />
                    </div>
                  )
                ) : (
                  <div className={styles.thumbPlaceholder}>
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                )}
                <div className={styles.thumbLabel}>
                  Page {p.page_number} ({Math.round(pageMetrics.averageConfidence * 100)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTER — Scanned Image and HTML Split Editor ── */}
      <div className={styles.centerSection}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          {thumbCollapsed && (
            <button className={styles.toolBtn} onClick={() => setThumbCollapsed(false)} title="Show thumbnails">
              <PanelLeftClose size={14} style={{ transform: 'scaleX(-1)' }} />
            </button>
          )}

          {/* Adjustments */}
          <div className={styles.toolGroup}>
            <button className={styles.toolBtn} onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out"><ZoomOut size={14} /></button>
            <span className={styles.zoomLabel}>{zoom}%</span>
            <button className={styles.toolBtn} onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in"><ZoomIn size={14} /></button>
            <button className={styles.toolBtn} onClick={() => setZoom(100)} title="Reset Adjustments"><Maximize size={14} /></button>
          </div>

          <div className={styles.toolGroup}>
            <button className={styles.toolBtn} onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate CW"><RotateCw size={14} /></button>
          </div>

          <div className={styles.toolGroup}>
            <button
              className={clsx(styles.toolBtn, syncScroll && styles.toolBtnActive)}
              onClick={() => setSyncScroll(s => !s)}
              title={syncScroll ? 'Disable sync scroll' : 'Enable sync scroll'}
            >
              {syncScroll ? <Link size={14} /> : <Unlink size={14} />}
            </button>
          </div>

          {/* WYSIWYG Styling Tools (Floating Toolbar replacement) */}
          <div className={styles.toolGroup}>
            <button className={styles.toolBtn} onClick={() => execFormat('bold')} title="Bold"><Bold size={14} /></button>
            <button className={styles.toolBtn} onClick={() => execFormat('italic')} title="Italic"><Italic size={14} /></button>
            <button className={styles.toolBtn} onClick={() => execFormat('underline')} title="Underline"><Underline size={14} /></button>
            <button className={styles.toolBtn} onClick={() => execFormat('insertUnorderedList')} title="Bullet List"><List size={14} /></button>
            <button className={styles.toolBtn} onClick={() => execFormat('insertOrderedList')} title="Numbered List"><ListOrdered size={14} /></button>
          </div>

          <div className={styles.toolGroup}>
            <button className={styles.toolBtn} onClick={insertTable} title="Insert Table"><LayoutGrid size={14} /></button>
            <button className={styles.toolBtn} onClick={insertPageBreak} title="Page Break"><Split size={14} /></button>
          </div>

          {/* Dev Mode toggle */}
          <button
            className={clsx(styles.devToggle, isDevMode && styles.devToggleActive)}
            onClick={() => {
              setIsDevMode(prev => !prev);
              if (!isDevMode) setDevTab('model');
            }}
          >
            {isDevMode ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>Developer Mode</span>
          </button>

          <div className={styles.headerRightActions}>
            <Button variant="secondary" size="sm" icon={<Save size={12} />} onClick={handleManualSave}>Save</Button>
            <Button variant="primary" size="sm" icon={<CheckCircle2 size={12} />} onClick={handleFinish}>Complete Review</Button>
            {!inspectorCollapsed ? (
              <button className={styles.toolBtn} onClick={() => setInspectorCollapsed(true)} title="Hide inspector"><PanelRightClose size={14} /></button>
            ) : (
              <button className={styles.toolBtn} onClick={() => setInspectorCollapsed(false)} title="Show inspector"><PanelRightClose size={14} style={{ transform: 'scaleX(-1)' }} /></button>
            )}
          </div>
        </div>

        {/* Developer Mode Tabs */}
        {isDevMode && (
          <div className={styles.devTabs}>
            {[
              ['model', 'Structured Model'],
              ['markdown', 'OCR Markdown Debug'],
              ['json', 'Structured Page JSON'],
              ['source', 'Renderer Input Model']
            ].map(([tab, label]) => (
              <button
                key={tab}
                className={clsx(styles.devTabBtn, devTab === tab && styles.devTabBtnActive)}
                onClick={() => setDevTab(tab as any)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Split Panes */}
        <div className={styles.centerArea}>
          {/* Left Split: Scanned image with highlighted overlay elements */}
          <div className={styles.pane} style={{ flex: `0 0 ${leftWidth}%` }}>
            <div className={styles.paneHeader}>
              <span className={styles.paneLabel}>Scanned Page</span>
              <div className={styles.imageAdjustmentControls}>
                <label className={styles.sliderLabel}>B:
                  <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                </label>
                <label className={styles.sliderLabel}>C:
                  <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                </label>
              </div>
            </div>
            
            <div className={styles.paneContent} ref={leftScrollRef}>
              <div className={styles.imageViewer}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {activePage?.image_url ? (
                    activePage.image_url.endsWith('.pdf') || activePage.image_url.includes('serve/') ? (
                      // Render as iframe first — backend sends correct mime type
                      // We detect PDF vs image from the served content-type via fetch,
                      // but for simplicity use an img tag with fallback to iframe
                      <ImageOrPdfPreview
                        src={activePage.image_url}
                        zoom={zoom}
                        rotation={rotation}
                        brightness={brightness}
                        contrast={contrast}
                        pageNum={activePageNum}
                      />
                    ) : (
                      <ThumbnailWithAuth
                        src={activePage.image_url}
                        className={styles.pageImage}
                        alt={`Page ${activePageNum}`}
                        style={{
                          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                          transformOrigin: 'top center'
                        }}
                      />
                    )
                  ) : (
                    <div className={styles.noImageText}>No image available</div>
                  )}

                  {/* Render Bounding Boxes Overlay on image */}
                  {activeElements.map((el: any) => {
                    if (!el.bbox) return null;
                    const [ymin, xmin, ymax, xmax] = el.bbox;
                    
                    // Style by confidence
                    let color = 'rgba(34, 197, 94, 0.4)'; // green
                    if (el.confidence < 0.60) color = 'rgba(239, 68, 68, 0.45)'; // red
                    else if (el.confidence < 0.85) color = 'rgba(245, 158, 11, 0.45)'; // yellow

                    return (
                      <div
                        key={el.id}
                        className={clsx(
                          styles.bboxOverlay,
                          selectedElementId === el.id && styles.bboxSelected,
                          hoveredElementId === el.id && styles.bboxHovered
                        )}
                        style={{
                          top: `${ymin / 10}%`,
                          left: `${xmin / 10}%`,
                          height: `${(ymax - ymin) / 10}%`,
                          width: `${(xmax - xmin) / 10}%`,
                          border: `1.5px solid ${color}`,
                          backgroundColor: hoveredElementId === el.id || selectedElementId === el.id ? color : 'transparent'
                        }}
                        onClick={() => {
                          setSelectedElementId(el.id);
                          // Scroll corresponding element into view in the right editor
                          const target = document.querySelector(`[data-block-id="${el.id}"]`) || document.querySelector(`[data-element-id="${el.id}"]`);
                          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        onMouseEnter={() => setHoveredElementId(el.id)}
                        onMouseLeave={() => setHoveredElementId(null)}
                        title={`Confidence: ${Math.round((el.confidence ?? 1.0) * 100)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Resizable Divider bar */}
          <div
            className={clsx(styles.divider, isDragging && styles.dragging)}
            onMouseDown={handleDividerMouseDown}
          />

          {/* Right Split: Text Editor content */}
          <div className={clsx(styles.pane, styles.editorPane)}>
            <div className={styles.paneHeader}>
              <span className={styles.paneLabel}>
                {isDevMode ? `${devTab.toUpperCase()} View` : 'Structured Model Review'}
              </span>
              <div className={styles.saveStatus}>
                {saveStatus === 'Saving...'
                  ? <><Loader2 size={12} className="animate-spin" /> <span className={styles.saveStatusSaving}>{saveStatus}</span></>
                  : <><CheckCircle2 size={12} /> <span className={styles.saveStatusSaved}>{saveStatus}</span></>
                }
              </div>
            </div>

            <div className={clsx(styles.paneContent, styles.editorContent)} ref={rightScrollRef}>
              
              {/* Tab 1: Structured model preview */}
              {(!isDevMode || devTab === 'model') && (
                <div
                  ref={editorRef}
                  className={styles.htmlEditor}
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onInput={handleEditorInput}
                  onClick={handleEditorClick}
                  aria-label="Structured examination model preview"
                />
              )}

              {/* Tab 2: Raw Markdown Source */}
              {isDevMode && devTab === 'markdown' && (
                <textarea
                  className={styles.rawTextArea}
                  value={activePage?.markdown || ''}
                  readOnly
                />
              )}

              {/* Tab 3: Structured JSON Array */}
              {isDevMode && devTab === 'json' && (
                <pre className={styles.jsonConsole}>
                  {JSON.stringify(activeStructuredPage || {}, null, 2)}
                </pre>
              )}

              {/* Tab 4: Generated HTML Code Source */}
              {isDevMode && devTab === 'source' && (
                <pre className={styles.jsonConsole}>
                  {JSON.stringify(job?.structured_document || {}, null, 2)}
                </pre>
              )}

            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusSection}>
            <span className={styles.statusBarDocName}>{job?.name}</span>
            <span className={styles.statusBarSeparator}>·</span>
            <span>Page {activePageNum} / {pages.length}</span>
          </div>
          <div className={styles.statusBarShortcuts}>
            <Keyboard size={12} />
            <span>Alt+← / Alt+→ Nav · Ctrl+S Save</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Inspector Panel (OCR details & Element Properties) ── */}
      <div className={clsx(styles.inspector, inspectorCollapsed && styles.collapsed)}>
        <div className={styles.inspectorHeader}>
          <span className={styles.inspectorTitle}>Inspector</span>
        </div>
        <div className={styles.inspectorBody}>
          
          {/* Confidence legend / averages */}
          <div className={styles.inspectorSection}>
            <div className={styles.inspectorSectionTitle}>Page Performance</div>
            
            <div className={styles.inspectorRow}>
              <span className={styles.inspectorKey}>Average Confidence</span>
              <strong style={{ color: metrics.averageConfidence >= 0.95 ? 'var(--success)' : metrics.averageConfidence >= 0.80 ? 'var(--warning)' : 'var(--danger)' }}>
                {Math.round(metrics.averageConfidence * 100)}%
              </strong>
            </div>

            <div className={styles.inspectorRow}>
              <span className={styles.inspectorKey}>Lowest Confidence</span>
              <strong style={{ color: metrics.lowestConfidence >= 0.95 ? 'var(--success)' : metrics.lowestConfidence >= 0.80 ? 'var(--warning)' : 'var(--danger)' }}>
                {Math.round(metrics.lowestConfidence * 100)}%
              </strong>
            </div>

            <div className={styles.inspectorRow}>
              <span className={styles.inspectorKey}>Highlighted Words</span>
              <strong>{metrics.highlightedWords}</strong>
            </div>

            <div className={styles.inspectorRow}>
              <span className={styles.inspectorKey}>Warnings</span>
              <strong style={{ color: metrics.warnings > 0 ? 'var(--danger)' : 'inherit' }}>{metrics.warnings}</strong>
            </div>

            <div className={styles.inspectorRow}>
              <span className={styles.inspectorKey}>Needs Review</span>
              <strong>{Math.round(metrics.reviewPercentage)}%</strong>
            </div>
            
            {/* Confidence Histogram */}
            <div style={{ marginTop: '8px' }}>
              <span className={styles.inspectorKey} style={{ display: 'block', marginBottom: '4px' }}>Confidence Distribution</span>
              <div className={styles.histogram}>
                <div className={styles.histBar} style={{ height: `${(metrics.distribution.high / (metrics.distribution.high + metrics.distribution.medium + metrics.distribution.low || 1)) * 100}%`, backgroundColor: 'var(--success)' }} title={`High (>=95%): ${metrics.distribution.high}`} />
                <div className={styles.histBar} style={{ height: `${(metrics.distribution.medium / (metrics.distribution.high + metrics.distribution.medium + metrics.distribution.low || 1)) * 100}%`, backgroundColor: 'var(--warning)' }} title={`Medium (80-94%): ${metrics.distribution.medium}`} />
                <div className={styles.histBar} style={{ height: `${(metrics.distribution.low / (metrics.distribution.high + metrics.distribution.medium + metrics.distribution.low || 1)) * 100}%`, backgroundColor: 'var(--danger)' }} title={`Low (<80%): ${metrics.distribution.low}`} />
              </div>
              <div className={styles.histLabels}>
                <span>High ({metrics.distribution.high})</span>
                <span>Med ({metrics.distribution.medium})</span>
                <span>Low ({metrics.distribution.low})</span>
              </div>
            </div>
          </div>

          {/* Image Quality Assessment (IQA) Report */}
          {activePage?.quality_report && (
            <div className={styles.inspectorSection}>
              <div className={styles.inspectorSectionTitle}>Image Quality Report</div>
              
              <div className={styles.inspectorRow}>
                <span className={styles.inspectorKey}>OCR Difficulty</span>
                <strong
                  className={styles.inspectorVal}
                  style={{
                    color: activePage.quality_report.difficulty === 'Low' ? 'var(--success)' :
                           activePage.quality_report.difficulty === 'Medium' ? 'var(--warning)' : 'var(--danger)'
                  }}
                >
                  {activePage.quality_report.overall_status} ({activePage.quality_report.difficulty})
                </strong>
              </div>

              <div className={styles.qualityGrid}>
                {[
                  { name: 'Resolution', data: activePage.quality_report.resolution },
                  { name: 'Blur', data: activePage.quality_report.blur },
                  { name: 'Contrast', data: activePage.quality_report.contrast },
                  { name: 'Noise', data: activePage.quality_report.noise },
                  { name: 'Perspective', data: activePage.quality_report.perspective },
                  { name: 'Exposure', data: activePage.quality_report.exposure },
                ].map(({ name, data }) => {
                  if (!data) return null;
                  let colorClass = styles.qualityGreen;
                  if (data.status === 'yellow') colorClass = styles.qualityYellow;
                  else if (data.status === 'red') colorClass = styles.qualityRed;

                  return (
                    <div key={name} className={styles.qualityItem}>
                      <span className={styles.qualityName}>{name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={clsx(styles.qualityBadge, colorClass)}>
                          {data.label}
                        </span>
                        <span style={{ color: '#64748B', fontSize: '10px' }}>{data.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activePage.quality_report.recommendations && activePage.quality_report.recommendations.length > 0 && (
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #1E293B' }}>
                  <span className={styles.inspectorKey} style={{ display: 'block', marginBottom: '6px' }}>Recommendations</span>
                  <ul className={styles.recommendationsList}>
                    {activePage.quality_report.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Selected Element metadata */}
          {selectedElement ? (
            <div className={styles.inspectorSection}>
              <div className={styles.inspectorSectionTitle}>Selected Block</div>
              
              <div className={styles.inspectorRow}>
                <span className={styles.inspectorKey}>Element ID</span>
                <span className={styles.inspectorVal}>{selectedElement.id || 'N/A'}</span>
              </div>

              <div className={styles.inspectorRow}>
                <span className={styles.inspectorKey}>Type</span>
                <select
                  className={styles.inspectorSelect}
                  value={selectedElement.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    updateModelBlock(selectedElement.id, { type: newType });
                  }}
                >
                  {[
                    'header', 'footer', 'section', 'subsection',
                    'instruction', 'question', 'sub_question', 'marks',
                    'mcq', 'option', 'fill_blank', 'match_following',
                    'table', 'paragraph', 'diagram_placeholder', 'image',
                    'signature', 'unreadable_marker', 'page_break'
                  ].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inspectorRow}>
                <span className={styles.inspectorKey}>Confidence</span>
                <strong
                  className={styles.inspectorVal}
                  style={{
                    color: selectedConfidence >= 0.85 ? 'var(--success)' :
                           selectedConfidence >= 0.60 ? 'var(--warning)' : 'var(--danger)'
                  }}
                >
                  {Math.round(selectedConfidence * 100)}%
                </strong>
              </div>

              <div className={styles.inspectorRow}>
                <span className={styles.inspectorKey}>Marks Allocation</span>
                <input
                  type="text"
                  className={styles.inspectorInput}
                  value={selectedElement.marks?.raw || ''}
                  onChange={(e) => {
                    const newMarks = e.target.value;
                    updateModelBlock(selectedElement.id, {
                      marks: newMarks ? { raw: newMarks, unit: 'marks' } : null,
                    });
                  }}
                  placeholder="e.g. [5]"
                />
              </div>

              <div className={styles.inspectorRowCol}>
                <span className={styles.inspectorKey}>Model Text</span>
                <textarea
                  key={selectedElement.id}
                  className={styles.inspectorTextArea}
                  defaultValue={selectedElement.text || ''}
                  onBlur={(e) => updateModelBlock(selectedElement.id, { text: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className={styles.noBlockSelected}>
              No block selected. Click any block in the structured model preview to inspect.
            </div>
          )}

          {/* Quick Checklist / Navigation */}
          <div className={styles.inspectorSection}>
            <div className={styles.inspectorSectionTitle}>Quick Actions</div>
            <div className={styles.quickInspectButtons}>
              <Button
                variant="outline"
                size="xs"
                icon={<AlertTriangle size={12} />}
                onClick={() => {
                  // Find next element with < 60% confidence
                  const nextLow = activeBlocks.find(
                    (e: any) => ((e.source?.ocr_confidence ?? e.confidence ?? 1.0) < 0.60) && e.id !== selectedElementId
                  );
                  if (nextLow) {
                    setSelectedElementId(nextLow.id);
                    const target = document.querySelector(`[data-element-id="${nextLow.id}"]`);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    triggerToast('info', 'Inspector', 'No other low-confidence elements found on page.');
                  }
                }}
              >
                Next Low Confidence
              </Button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
