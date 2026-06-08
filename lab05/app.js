// ============================================================
// Завдання 1 — API Explorer (міні-Postman)
// ============================================================
// Вимоги:
//   1. Form → fetch: метод, URL, headers, body.
//      GET/HEAD без body (інакше TypeError).
//   2. Парсинг headers з textarea:
//      "Content-Type: application/json" → { "Content-Type": "application/json" }
//      Порожні рядки і "# коментар" — ігнорувати.
//   3. Валідація JSON body перед fetch.
//   4. Відображення response:
//      - Статус-код з кольоровим маркером (2xx/3xx/4xx/5xx).
//      - Response headers (всі).
//      - Тіло: JSON форматувати, text/html — як є.
//      - Час виконання (performance.now()).
//   5. AbortController при повторному кліку.
//   6. Історія останніх 10: метод + URL + status.
//      Клік → форма заповнюється цими значеннями.
//                                                 
// Тестові URL:
//   GET  https://httpbin.org/get
//   GET  https://httpbin.org/status/404
//   GET  https://httpbin.org/status/500
//   GET  https://httpbin.org/delay/3
//   POST https://jsonplaceholder.typicode.com/posts
//        body: { "title": "test", "body": "body", "userId": 1 }
// ============================================================

const methodSel = document.getElementById("method");
const urlInput = document.getElementById("url");
const sendBtn = document.getElementById("send");
const headersTA = document.getElementById("headers");
const bodyTA = document.getElementById("body");
const bodyErr = document.getElementById("body-error");

const responseDiv = document.getElementById("response");
const statusLine = document.getElementById("status-line");
const responseHeaders = document.getElementById("response-headers");
const responseBody = document.getElementById("response-body");

const historyEl = document.getElementById("history");

let currentController = null;
const history = []; // { method, url, status, headers, body }

sendBtn.addEventListener("click", async () => {
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();
  const { signal } = currentController;

  bodyErr.hidden = true;
  bodyErr.textContent = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "Loading...";

  const method = methodSel.value;
  const url = urlInput.value.trim();
  //пробіли по краях

  if (!url) {
    alert("Будь ласка, введіть URL");
    resetSendButton();
    return;
  }
// 1
  const headers = {};
  const headersText = headersTA.value;
  const lines = headersText.split("\n");

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf(":");
    if (index !== -1) {
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim();
      if (key) {
        headers[key] = value;
      }
    }
  }
//2
  let body = null;
  const bodyText = bodyTA.value.trim();
  const methodsWithBody = ["POST", "PUT", "PATCH", "DELETE"];

  if (methodsWithBody.includes(method) && bodyText) {
    try {
      JSON.parse(bodyText); // Перевірка на валідність JSON
      body = bodyText;
    } catch (e) {
      bodyErr.textContent = `Невалідний JSON: ${e.message}`;
      bodyErr.hidden = false;
      resetSendButton();
      return; // Блокуємо fetch
    }
  }

  const fetchOptions = {
    method: method,
    headers: headers,
    signal: signal
  };

  if (methodsWithBody.includes(method) && body !== null) {
    fetchOptions.body = body;
  }

  const startTime = performance.now();

  try {
    const response = await fetch(url, fetchOptions);
    const endTime = performance.now();
    const elapsedTime = Math.round(endTime - startTime);

    responseDiv.classList.add("visible");

    const status = response.status;
    statusLine.className = "status-line"; 
    if (status >= 200 && status < 300) statusLine.classList.add("s2");
    else if (status >= 300 && status < 400) statusLine.classList.add("s3");
    else if (status >= 400 && status < 500) statusLine.classList.add("s4");
    else if (status >= 500) statusLine.classList.add("s5");

    statusLine.innerHTML = `${status} ${response.statusText} <span class="elapsed">${elapsedTime} ms</span>`;
//3 Response Headers
    let headersStr = "";
    for (const [key, value] of response.headers.entries()) {
      headersStr += `${key}: ${value}\n`;
    }
    responseHeaders.textContent = headersStr || "[Немає заголовків]";

//Response Body
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const json = await response.json();
      responseBody.textContent = JSON.stringify(json, null, 2);
    } else if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const text = await response.text();
      responseBody.textContent = text;
    } else {
      responseBody.textContent = "[binary content]";
      //заглушка
    }

    addToHistory(method, url, status);

  } catch (error)         {
    if (error.name === "AbortError") {
      console.log("Запит скасовано через новий клік");
      return;
    }
//біда
    responseDiv.classList.add("visible");
    statusLine.className = "status-line s5";
    statusLine.innerHTML = `Помилка запиту <span class="elapsed">Error</span>`;
    responseHeaders.textContent = "N/A";
    responseBody.textContent = `Помилка мережі або CORS: ${error.message}`;
  
//!
} finally {
    resetSendButton();
    currentController = null;
  }
});


//кнопку в початковий стан
function resetSendButton() {
  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}
//поточний запит у «блокнот» історії
function addToHistory(method, url, status) {
  history.unshift({ method, url, status, headers: headersTA.value, body: bodyTA.value });
  
  if (history.length > 10) {
    history.pop();
  }
  
  renderHistory();
}
// щновлює історію в сайдбар
function renderHistory() {
  historyEl.innerHTML = "";
  
  if (history.length === 0) {
    historyEl.innerHTML = `<li style="background:#f6f8fa; color:#888; cursor: default;">Поки нічого</li>`;
    return;
  }

  history.forEach((item, index) => {
    const li = document.createElement("li");
    
    let statusColor = "#666";
    if (item.status >= 200 && item.status < 300) statusColor = "#00ff55";
    else if (item.status >= 400 && item.status < 500) statusColor = "#ff8000";
    else if (item.status >= 500) statusColor = "rgb(255, 0, 0)";

    li.innerHTML = `
      <span class="method">${item.method}</span>
      <span class="url" title="${item.url}">${shortenUrl(item.url)}</span>
      <span class="status" style="color: ${statusColor}">${item.status}</span>
    `;

    li.addEventListener("click", () => {
      methodSel.value = item.method;
      urlInput.value = item.url;
      headersTA.value = item.headers;
      bodyTA.value = item.body;
      bodyErr.hidden = true;
    });

    historyEl.appendChild(li);
  });
}
// обрізає адреси

function shortenUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname !== "/" ? parsed.host + parsed.pathname : parsed.host;
  } catch (e) {
    return url.length > 25 ? url.substring(0, 22) + "..." : url;
  }}