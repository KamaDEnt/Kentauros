export const LEAD_RESULTS_PAGE_SIZE = 10;

export const getPaginatedLeadResults = (results, requestedPage) => {
  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / LEAD_RESULTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * LEAD_RESULTS_PAGE_SIZE;
  const pageResults = results.slice(startIndex, startIndex + LEAD_RESULTS_PAGE_SIZE);

  return {
    pageResults,
    totalItems,
    totalPages,
    currentPage,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: startIndex + pageResults.length,
  };
};
