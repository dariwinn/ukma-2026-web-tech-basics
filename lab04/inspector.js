// ============================================================
// Завдання 1 — DOM-аналізатор
// ============================================================
// 6 функцій. Не змінюйте HTML.
// Обмеження:
//   - жодного for циклу (map/filter/reduce/forEach)
//   - жодного innerHTML (читання тексту через textContent)
//   - кожна функція обробляє "нічого не знайдено" — повертає [] або null,
//     НЕ кидає помилку
// ============================================================

/**
 * Кількість слів у textContent елемента, заданого селектором.
 * Враховує trim, кілька пробілів, табуляції.
 * countWordsIn("#post-1") // ≈ 30
 * countWordsIn("#missing") // 0
 */
function countWordsIn(selector) {
  const element = document.querySelector(selector);
  if (!element) return 0;

  const text = element.textContent. trim(); 
  // обрізаємо пробіли 
  if (!text) return 0;

  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Усі посилання, з ознакою external (інший origin).
 * [{ text, href, isExternal }, ...]
 * split(/\s+/) розбиває рядок на масив підрядків..
 */
function allLinks() {
  const links = Array.from(document.querySelectorAll(' a'));
  if (links.length === 0) return [];

  return links. map (link => {
    const isExternal =   link.origin !== window.location.origin;
    
    return {
      text: link.textContent.trim(),
      href: link.getAttribute('href'), 
      isExternal: isExternal
    };
  });
}

/**
 * <img> з проблемами:
 *   { src, reason: "no-alt" }      — атрибут alt відсутній
 *   { src, reason: "empty-alt" }   — alt="" але img інформативне
 *   .filter()..            (має width/height АБО всередині <figure>)
 */
function findOrphanImages() {
  const images = Array.from(document.querySelectorAll(' img'));
  if (images.length === 0) return [];

  return images
    .map(img => {
      const src = img.getAttribute('src');
      
      if (!img.hasAttribute('alt')) {
        return { src, reason: "no-alt" };
      }
      
      const altValue = img.getAttribute('alt');
      if (altValue === "") {
        const hasSize = img.hasAttribute('width') || img.hasAttribute('height');
        const isInFigure = img.closest('figure') !== null;
        
        if (hasSize || isInFigure) {
          return { src, reason: "empty-alt" };
        }
      }
      
      return null; 
    })
    .filter(item => item !== null); 
}

/**
 * Outline документа — усі h1-h6 у порядку появи.
 * [{ level: 1, text: "..." }, { level: 2, text: "..." }, ...]
 * reduce() складає їх до списку..
 * Якщо рівень стрибає (h2 → h4), додати warning:
 *   { level: 4, text: "...", warning: "h4 after h2" }
 */
function getHeadingsOutline() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length === 0) return [];

  return headings.reduce((acc, heading) => {
    const level = parseInt(heading.tagName.substring(1), 10);
    const text = heading.textContent.trim();
    
    const currentItem = { level, text };
    
    if (acc.length > 0) {
      const prevItem = acc[acc.length - 1];
      if (level > prevItem.level + 1) {
        currentItem.warning = `h${level} after h${prevItem.level}`;
      }
    }
    
    acc.push(currentItem);
    return acc;
  }, []);
}

/**
 * Серед елементів, що матчать селектор, повертає найглибше вкладений
 * (з максимальною кількістю предків). При нічиї — перший.
 * Якщо нічого не знайдено — null.
 */
function findDeepest(selector) {
  const elements = Array.from(document.querySelectorAll(selector));
  if (elements.length === 0) return null;

  const getDepth = (el) => {
    let depth = 0;
    let current = el;
    while (current.  parentElement) {
      depth++;
      current = current.parentElement;
    }
    return depth;
  };

  return elements.reduce((deepest, current) => {
    const currentDepth = getDepth(current);
    const deepestDepth = getDepth(deepest);
    
    return currentDepth > deepestDepth ? current : deepest;
  });
}

/**
 * Топ-N найчастіших слів у елементі.
 * «Код» і «код» однакові..
 * Ігнорувати: регістр, пунктуацію, слова коротші 3 символів.
 * [{ word: "семантика", count: 4 }, { word: "html", count: 2 }, ...]
 */
function wordFrequency(selector, n = 10) {
  const element = document.querySelector(selector);
  if (!element) return [];

  const text = element.textContent.toLowerCase();
  
  const words = text.match(/[a-zа-яіїєґ']+/gu);
  if (!words) return [];

  const filteredWords = words.filter(word => word.length >= 3);

  const frequencyMap = filteredWords.reduce((map, word) => {
    map[word] = (map[word] || 0) + 1;
    return map;
  }, {});

  return Object.entries(frequencyMap)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

console.log("Слів у post-1:", countWordsIn("#post-1"));
console.log("Посилання:", allLinks());
console.log("Проблемні img:", findOrphanImages());
console.log("Outline:", getHeadingsOutline());
console.log("Найглибше .highlight:", findDeepest(".highlight"));
console.log("Топ слів у post-1:", wordFrequency("#post-1", 5));