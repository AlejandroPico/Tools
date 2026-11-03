function replacement(template, match, source, limit) {
  const chunks=[];let length=0,end=0;
  const add=text=>{length+=text.length;if(length>limit)throw Error('El reemplazo produciría más de 2 MB de texto.');chunks.push(text);};
  const substitute=(token, part) => {
    if (part === '$') return '$'; if (part === '&') return match[0];
    if (part === '`') return source.slice(0, match.index); if (part === "'") return source.slice(match.index + match[0].length);
    if (part.startsWith('<')) return match.groups ? match.groups[part.slice(1, -1)] ?? '' : token;
    const n = Number(part); if (n > 0 && n < match.length) return match[n] ?? '';
    if (part.length === 2 && Number(part[0]) > 0 && Number(part[0]) < match.length) return (match[Number(part[0])] ?? '') + part[1];
    return token;
  };
  for(const token of template.matchAll(/\$(\$|&|`|'|\d{1,2}|<[^>]+>)/g)){add(template.slice(end,token.index));add(substitute(token[0],token[1]));end=token.index+token[0].length;}
  add(template.slice(end));return chunks.join('');
}
export function regexRun({ pattern, flags = 'g', text = '', replace = false, template = '' }) {
  if (pattern.length > 2000 || text.length > 200000 || template.length > 2000) throw new Error('Límite: patrón 2000 caracteres, texto 200 000 y reemplazo 2000.');
  new RegExp(pattern, flags);const all = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  const matches = []; let match, truncated = false, captured = 0;
  while ((match = all.exec(text))) {
    if (matches.length === 1000) { truncated = true; break; }
    captured+=match.reduce((n,value)=>n+(value?.length||0),0);if(captured>2_000_000)throw Error('Las capturas superan 2 millones de caracteres. Reduce el texto o los grupos.');
    matches.push(match);
    if (!match[0].length) { const cp = text.codePointAt(all.lastIndex); all.lastIndex += (all.unicode || all.unicodeSets) && cp > 0xffff ? 2 : 1; }
    if (!flags.includes('g')) break;
  }
  let result = null;
  if (replace) {
    if (truncated) throw new Error('Más de 1000 coincidencias: divide el texto antes de reemplazar.');
    let end = 0, length = 0; const pieces = [];
    for (const item of matches) {
      const prefix=text.slice(end,item.index);const piece = prefix + replacement(template, item, text, 2_000_000-length-prefix.length); length += piece.length;
      if (length > 2_000_000) throw new Error('El reemplazo produciría más de 2 MB de texto.'); pieces.push(piece); end = item.index + item[0].length;
    }
    if(length+text.length-end>2_000_000)throw Error('El reemplazo produciría más de 2 MB de texto.');result = pieces.join('') + text.slice(end);
  }
  return { matches: matches.map(item => ({ index: item.index, text: item[0].slice(0, 1000), groups: item.slice(1, 51).map(group => group?.slice(0, 1000) ?? null) })), truncated, result };
}
