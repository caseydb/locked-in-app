import { useState, useEffect } from "react";
import { calculatePageSize } from "../utils";
import { HistoryEntry } from "../types";

export function usePagination(history: HistoryEntry[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);

  // Update page size based on screen dimensions
  useEffect(() => {
    const updatePageSize = () => {
      setPageSize(calculatePageSize(window.innerWidth, window.innerHeight));
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const paginated = history.slice((page - 1) * pageSize, page * pageSize);

  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));

  return {
    page,
    pageSize,
    totalPages,
    paginated,
    goToNextPage,
    goToPrevPage,
  };
}