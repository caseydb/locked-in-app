import { useState, useEffect } from "react";
import { calculateDynamicWidth } from "../utils";
import { HistoryEntry } from "../types";

export function useDynamicWidth(history: HistoryEntry[]) {
  const [dynamicWidthClasses, setDynamicWidthClasses] = useState(
    "w-[95%] min-[600px]:w-[90%] min-[1028px]:w-[60%]"
  );

  // Update dynamic width when history changes
  useEffect(() => {
    setDynamicWidthClasses(calculateDynamicWidth(history));
  }, [history]);

  return dynamicWidthClasses;
}