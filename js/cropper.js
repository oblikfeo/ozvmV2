/*
  Редактор кадрирования изображения.

  Зачем: и плитка на витрине, и обложка на странице акции показывают картинку
  через object-fit: cover, то есть браузер обрезает её по центру сам.
  Из-за этого загруженное фото уезжало вбок и обрезалось не там, где нужно.
  Здесь администратор сам выбирает масштаб и видимую область,
  а на выходе получается готовая картинка ровно 16:9 — в тех же пропорциях,
  в которых она показывается на сайте.

  Зависимостей нет: обычный canvas, работает статикой на Vercel.
*/

const ImageCropper = (function () {
  // Пропорции и размер результата. 16:9 — то же соотношение,
  // что у плитки и обложки, поэтому кадр совпадает с тем, что увидит покупатель.
  const ASPECT = 16 / 9;
  const OUT_WIDTH = 1200;
  const OUT_HEIGHT = Math.round(OUT_WIDTH / ASPECT); // 675
  const JPEG_QUALITY = 0.85;

  let overlay = null;
  let img = null;
  let onApplyCallback = null;

  // Геометрия: baseScale — минимальный масштаб, при котором картинка
  // полностью закрывает рамку (аналог object-fit: cover).
  let baseScale = 1;
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let viewportW = 0;
  let viewportH = 0;

  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "cropper";
    overlay.innerHTML = `
      <div class="cropper__dialog" role="dialog" aria-label="Кадрирование изображения">
        <div class="cropper__header">
          <h3 class="cropper__title">Кадрирование</h3>
          <button type="button" class="cropper__close" aria-label="Закрыть">&times;</button>
        </div>

        <p class="cropper__hint">Перетащите изображение мышью, чтобы выбрать видимую область</p>

        <div class="cropper__viewport" id="cropper-viewport">
          <img class="cropper__image" id="cropper-image" alt="" draggable="false" />
        </div>

        <div class="cropper__zoom">
          <span class="cropper__zoom-label">Масштаб</span>
          <input type="range" id="cropper-zoom" min="1" max="3" step="0.01" value="1" />
        </div>

        <div class="cropper__actions">
          <button type="button" class="btn btn-accent" id="cropper-apply">Применить</button>
          <button type="button" class="btn btn-outline" id="cropper-cancel">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const viewport = overlay.querySelector("#cropper-viewport");
    img = overlay.querySelector("#cropper-image");

    overlay.querySelector("#cropper-cancel").addEventListener("click", close);
    overlay.querySelector(".cropper__close").addEventListener("click", close);
    overlay.querySelector("#cropper-apply").addEventListener("click", apply);

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) close();
    });

    overlay.querySelector("#cropper-zoom").addEventListener("input", (e) => {
      setZoom(parseFloat(e.target.value));
    });

    // Перетаскивание
    viewport.addEventListener("mousedown", startDrag);
    viewport.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("touchmove", onDrag, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);

    // Колесо мыши — тоже масштаб
    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        setZoom(zoom + (e.deltaY < 0 ? 0.08 : -0.08));
      },
      { passive: false }
    );
  }

  function pointerPos(e) {
    const t = e.touches && e.touches[0];
    return { x: t ? t.clientX : e.clientX, y: t ? t.clientY : e.clientY };
  }

  function startDrag(e) {
    e.preventDefault();
    const p = pointerPos(e);
    dragging = true;
    dragStartX = p.x - offsetX;
    dragStartY = p.y - offsetY;
  }

  function onDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = pointerPos(e);
    offsetX = p.x - dragStartX;
    offsetY = p.y - dragStartY;
    clampAndRender();
  }

  function endDrag() {
    dragging = false;
  }

  function setZoom(value) {
    const next = Math.min(3, Math.max(1, value));

    // Масштабируем относительно центра рамки, чтобы картинка не «убегала».
    const centerX = viewportW / 2;
    const centerY = viewportH / 2;
    const ratio = next / zoom;

    offsetX = centerX - (centerX - offsetX) * ratio;
    offsetY = centerY - (centerY - offsetY) * ratio;

    zoom = next;
    overlay.querySelector("#cropper-zoom").value = String(zoom);
    clampAndRender();
  }

  // Не даём вытащить картинку за пределы рамки — пустых полей быть не должно.
  function clampAndRender() {
    const dw = img.naturalWidth * baseScale * zoom;
    const dh = img.naturalHeight * baseScale * zoom;

    offsetX = Math.min(0, Math.max(viewportW - dw, offsetX));
    offsetY = Math.min(0, Math.max(viewportH - dh, offsetY));

    img.style.width = dw + "px";
    img.style.height = dh + "px";
    img.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  function fit() {
    const viewport = overlay.querySelector("#cropper-viewport");
    viewportW = viewport.clientWidth;
    viewportH = viewport.clientHeight;

    baseScale = Math.max(viewportW / img.naturalWidth, viewportH / img.naturalHeight);
    zoom = 1;
    overlay.querySelector("#cropper-zoom").value = "1";

    // Стартуем по центру
    const dw = img.naturalWidth * baseScale;
    const dh = img.naturalHeight * baseScale;
    offsetX = (viewportW - dw) / 2;
    offsetY = (viewportH - dh) / 2;

    clampAndRender();
  }

  function apply() {
    const scale = baseScale * zoom;

    // Переводим экранные координаты рамки в координаты исходника
    const sx = -offsetX / scale;
    const sy = -offsetY / scale;
    const sWidth = viewportW / scale;
    const sHeight = viewportH / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUT_WIDTH;
    canvas.height = OUT_HEIGHT;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, OUT_WIDTH, OUT_HEIGHT);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const cb = onApplyCallback;
    close();
    if (cb) cb(dataUrl);
  }

  function close() {
    if (overlay) overlay.classList.remove("is-open");
    onApplyCallback = null;
  }

  function openWithSource(src, onApply, onError) {
    if (!overlay) build();

    onApplyCallback = onApply;
    overlay.classList.add("is-open");

    img.onload = function () {
      // Ждём, пока рамка получит реальные размеры после показа
      requestAnimationFrame(fit);
    };
    img.onerror = function () {
      close();
      if (onError) onError("Не удалось открыть изображение.");
    };
    img.src = src;
  }

  /** Открыть редактор для выбранного файла */
  function openFile(file, onApply, onError) {
    const reader = new FileReader();
    reader.onerror = () => onError && onError("Не удалось прочитать файл.");
    reader.onload = (e) => openWithSource(e.target.result, onApply, onError);
    reader.readAsDataURL(file);
  }

  /** Открыть редактор для уже выбранной картинки (например из галереи) */
  function openSrc(src, onApply, onError) {
    openWithSource(src, onApply, onError);
  }

  return { openFile, openSrc, ASPECT };
})();
