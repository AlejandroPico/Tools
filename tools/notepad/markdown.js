export function safeLink(url) {
  try { const parsed = new URL(url); return ['https:', 'http:', 'mailto:'].includes(parsed.protocol) ? parsed.href : null; }
  catch { return null; }
}
export function markdownBlocks(source) {
  const blocks = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let code = null;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (code) { blocks.push({ type: 'code', text: code.join('\n') }); code = null; }
      else code = [];
      continue;
    }
    if (code) { code.push(line); continue; }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (heading) blocks.push({ type: `h${heading[1].length}`, text: heading[2] });
    else if (bullet || ordered) blocks.push({ type: ordered ? 'ol-item' : 'ul-item', text: (ordered || bullet)[1] });
    else if (/^>\s?/.test(line)) blocks.push({ type: 'blockquote', text: line.replace(/^>\s?/, '') });
    else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) blocks.push({ type: 'hr', text: '' });
    else if (!line.trim()) blocks.push({ type: 'break', text: '' });
    else blocks.push({ type: 'p', text: line });
  }
  if (code) blocks.push({ type: 'code', text: code.join('\n') });
  return blocks;
}
function inline(text, target) {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g;
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    target.append(document.createTextNode(text.slice(end, match.index)));
    const token = match[0];
    let element;
    if (token.startsWith('`')) { element = document.createElement('code'); element.textContent = token.slice(1, -1); }
    else if (token.startsWith('**')) { element = document.createElement('strong'); element.textContent = token.slice(2, -2); }
    else if (token.startsWith('*')) { element = document.createElement('em'); element.textContent = token.slice(1, -1); }
    else {
      const link = /^\[([^\]]+)\]\((.*)\)$/.exec(token);
      const url = safeLink(link[2]);
      element = document.createElement(url ? 'a' : 'span'); element.textContent = link[1];
      if (url) { element.href = url; element.target = '_blank'; element.rel = 'noopener noreferrer'; }
    }
    target.append(element); end = match.index + token.length;
  }
  target.append(document.createTextNode(text.slice(end)));
}
export function renderMarkdown(source, target) {
  target.replaceChildren();
  let list = null;
  for (const block of markdownBlocks(source)) {
    if (block.type.endsWith('-item')) {
      const type = block.type.slice(0, 2);
      if (!list || list.tagName.toLowerCase() !== type) { list = document.createElement(type); target.append(list); }
      const item = document.createElement('li'); inline(block.text, item); list.append(item); continue;
    }
    list = null;
    if (block.type === 'break') continue;
    const element = document.createElement(block.type === 'code' ? 'pre' : block.type);
    if (block.type === 'code') element.textContent = block.text;
    else inline(block.text, element);
    target.append(element);
  }
}
