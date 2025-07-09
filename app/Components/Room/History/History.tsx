import React from "react";
import HistoryModal from "./HistoryModal";
import EmptyState from "./EmptyState";
import MobileHistoryView from "./MobileHistoryView";
import DesktopHistoryView from "./DesktopHistoryView";
import PaginationControls from "./PaginationControls";
import CloseButton from "./CloseButton";
import { useHistoryData } from "./hooks/useHistoryData";
import { usePagination } from "./hooks/usePagination";
import { useDynamicWidth } from "./hooks/useDynamicWidth";

export default function History({ roomId, onClose }: { roomId: string; onClose?: () => void }) {
  const { history, users, loading } = useHistoryData(roomId);
  const { page, pageSize, totalPages, paginated, goToNextPage, goToPrevPage } = usePagination(history);
  const dynamicWidthClasses = useDynamicWidth(history);

  if (loading) {
    return <div className="text-white text-center mt-10">Loading history...</div>;
  }

  return (
    <HistoryModal dynamicWidthClasses={dynamicWidthClasses} onClose={onClose}>
      {history.length === 0 ? (
        <EmptyState onClose={onClose} />
      ) : (
        <>
          <div className="w-full">
            <MobileHistoryView entries={paginated} users={users} />
            <DesktopHistoryView entries={paginated} users={users} />
          </div>
          
          {history.length > pageSize && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPrevious={goToPrevPage}
              onNext={goToNextPage}
            />
          )}
          
          <CloseButton onClose={onClose} />
        </>
      )}
    </HistoryModal>
  );
}