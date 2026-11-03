const namespace='http://www.w3.org/2000/svg';
const elements=new Set('svg g defs path rect circle ellipse line polyline polygon text tspan title desc linearGradient radialGradient stop clipPath mask pattern use symbol'.split(' '));
const attributes=new Set('id viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points fill fill-opacity fill-rule stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity transform preserveAspectRatio offset stop-color stop-opacity gradientUnits gradientTransform spreadMethod clip-path clip-rule clipPathUnits mask maskUnits maskContentUnits patternUnits patternContentUnits patternTransform text-anchor dominant-baseline font-size font-family font-weight font-style letter-spacing dx dy rotate vector-effect'.split(' '));
const styleProperties=new Set('fill fill-opacity fill-rule stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-opacity opacity stop-color stop-opacity font-size font-family font-weight font-style text-anchor dominant-baseline letter-spacing'.split(' '));
const safeValue=value=>!/[\\<>@]|(?:expression|javascript|data:|https?:|file:|var\s*\()/i.test(value)&&[...value.matchAll(/url\s*\(([^)]*)\)/gi)].every(match=>/^\s*['"]?#[\w:.-]+['"]?\s*$/.test(match[1]))&&!/url(?!\s*\()/i.test(value);

// The exported SVG is the same restricted document used in the inert <img> preview.
export function sanitizeSVG(source) {
  if(source.length>1_000_000)throw Error('SVG admite hasta 1 MB.');
  if(/<!DOCTYPE|<!ENTITY/i.test(source))throw Error('No se admiten entidades ni declaraciones externas en SVG.');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),root=doc.documentElement;
  if(doc.querySelector('parsererror')||root.localName!=='svg'||root.namespaceURI!==namespace)throw Error('El documento SVG no es válido.');
  if(root.querySelectorAll('*').length>5000)throw Error('El SVG supera 5.000 elementos.');
  let removed=0;
  function clean(node){
    for(const child of [...node.childNodes]){
      if(child.nodeType===1){if(child.namespaceURI!==namespace||!elements.has(child.localName)){child.remove();removed++;}else clean(child);}
      else if(![3,4].includes(child.nodeType)){child.remove();removed++;}
    }
    for(const attr of [...node.attributes]){
      const name=attr.name,value=attr.value;
      if(name==='xmlns'&&node===root){node.setAttribute('xmlns',namespace);continue;}
      if(name==='href'||name==='xlink:href'){
        node.removeAttributeNode(attr);if(/^#[\w:.-]+$/.test(value))node.setAttribute('href',value);else removed++;continue;
      }
      if(name==='style'){
        const declarations=value.split(';').map(part=>{const colon=part.indexOf(':');if(colon<0)return '';const key=part.slice(0,colon).trim().toLowerCase(),val=part.slice(colon+1).trim();if(styleProperties.has(key)&&safeValue(val))return `${key}:${val}`;removed++;return '';}).filter(Boolean);
        node.removeAttribute('style');if(declarations.length)node.setAttribute('style',declarations.join(';'));continue;
      }
      if(attr.namespaceURI||!attributes.has(name)||!safeValue(value)){node.removeAttributeNode(attr);removed++;}
    }
  }
  clean(root);root.setAttribute('xmlns',namespace);
  // Bound local <use> expansion: recursive/repeated references can exhaust a rasterizer.
  const uses=[...root.querySelectorAll('use')];
  if(uses.length){for(const use of uses){use.remove();removed++;}}
  return {source:new XMLSerializer().serializeToString(root),removed};
}
