/**
 * Build a DOM element. `on*` attributes become event listeners; other attributes are set as-is.
 * String children become text nodes, so user-entered text is never parsed as markup.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== false && value !== null && value !== undefined) {
      el.setAttribute(key, value === true ? '' : value);
    }
  }
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}
