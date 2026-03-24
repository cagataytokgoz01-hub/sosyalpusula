import { extractSheetId } from './extractSheetId';

export const fetchSheetData = async (sheetUrlOrId: string) => {
  const sheetId = extractSheetId(sheetUrlOrId);
  return window.sociometryApi.fetchSheetData(sheetId);
};
