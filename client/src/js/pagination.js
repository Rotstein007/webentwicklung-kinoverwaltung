function debounce (fn, delayMs) {
  let timeoutId;

  return () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(fn, delayMs);
  };
}

function clamp (value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createResponsivePaginator ({
  listEl,
  controlsEl,
  renderItem,
  getItems,
  estimateItemHeightPx = 56,
  bottomReservePx = 0,
  fixedItemsPerPage = null,
  getFixedItemsPerPage = null
}) {
  let pageIndex = 0;
  let itemHeightPx = estimateItemHeightPx;

  const paginationNavEl = controlsEl.querySelector('.pagination-nav');
  const pageLabelEl = controlsEl.querySelector('[data-pagination="label"]');
  const prevBtn = controlsEl.querySelector('[data-pagination="prev"]');
  const nextBtn = controlsEl.querySelector('[data-pagination="next"]');

  if (!pageLabelEl || !prevBtn || !nextBtn) {
    throw new Error('Pagination-Controls unvollständig.');
  }

  function measureItemHeight (items) {
    if (items.length === 0) {
      return;
    }

    listEl.innerHTML = renderItem(items[0]);
    const firstChild = listEl.firstElementChild;
    if (firstChild) {
      const rect = firstChild.getBoundingClientRect();
      const measured = Math.max(1, Math.round(rect.height));
      itemHeightPx = measured;
    }
  }

  function computeItemsPerPage () {
    // Prüfe dynamische Funktion zuerst
    if (typeof getFixedItemsPerPage === 'function') {
      const dynamicFixed = getFixedItemsPerPage();
      if (dynamicFixed !== null && dynamicFixed > 0) {
        return dynamicFixed;
      }
    }
    // Dann statischen Wert
    if (fixedItemsPerPage !== null && fixedItemsPerPage > 0) {
      return fixedItemsPerPage;
    }
    // Sonst responsive Berechnung
    const rect = listEl.getBoundingClientRect();
    const footer = document.querySelector('footer');
    const footerHeight = footer ? Math.round(footer.getBoundingClientRect().height) : 0;
    const controlsRect = controlsEl.getBoundingClientRect();
    const controlsHeight = Math.round(controlsRect.height);
    const controlsMarginTop = Number.parseFloat(window.getComputedStyle(controlsEl).marginTop) || 0;
    const safetyGap = 8;
    const reserved = bottomReservePx + footerHeight + controlsHeight + controlsMarginTop + safetyGap;
    const available = Math.max(1, Math.floor(window.innerHeight - rect.top - reserved));
    const perPage = Math.max(1, Math.floor(available / itemHeightPx));
    return perPage;
  }

  function render () {
    const items = getItems();
    if (!Array.isArray(items)) {
      throw new Error('getItems() muss ein Array liefern.');
    }

    if (items.length > 0) {
      measureItemHeight(items);
    } else {
      listEl.innerHTML = '';
    }

    const perPage = computeItemsPerPage();
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    pageIndex = clamp(pageIndex, 0, totalPages - 1);

    const start = pageIndex * perPage;
    const pageItems = items.slice(start, start + perPage);
    listEl.innerHTML = pageItems.map(renderItem).join('');

    pageLabelEl.textContent = `Seite ${pageIndex + 1} / ${totalPages}`;
    prevBtn.disabled = pageIndex <= 0;
    nextBtn.disabled = pageIndex >= totalPages - 1;

    // Navigation ausblenden wenn alles auf eine Seite passt
    if (paginationNavEl) {
      paginationNavEl.style.display = totalPages <= 1 ? 'none' : '';
    }
  }

  function goPrev () {
    pageIndex = Math.max(0, pageIndex - 1);
    render();
  }

  function goNext () {
    pageIndex = pageIndex + 1;
    render();
  }

  const onResize = debounce(render, 150);

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  window.addEventListener('resize', onResize);

  render();

  return {
    render,
    setPageIndex (nextIndex) {
      pageIndex = Math.max(0, Number.parseInt(nextIndex, 10) || 0);
      render();
    },
    destroy () {
      prevBtn.removeEventListener('click', goPrev);
      nextBtn.removeEventListener('click', goNext);
      window.removeEventListener('resize', onResize);
    }
  };
}
