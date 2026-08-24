import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      's',
      'strike',
      'p',
      'br',
      'div',
      'span',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitize plain text input (strip all HTML)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitize task description
 */
export function sanitizeTaskDescription(description: string): string {
  return sanitizeHtml(description);
}

/**
 * Sanitize AI conversation message content
 */
export function sanitizeAIMessage(content: string): string {
  return sanitizeHtml(content);
}

/**
 * Sanitize user-provided strings for safe storage
 */
export function sanitizeUserInput(input: string, maxLength: number = 10000): string {
  if (!input) return '';
  const sanitized = sanitizeText(input);
  return sanitized.slice(0, maxLength);
}
