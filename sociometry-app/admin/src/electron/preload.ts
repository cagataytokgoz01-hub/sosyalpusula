import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sociometryApi', {
  listProjects: () => ipcRenderer.invoke('list-projects'),
  createProject: (title: string, organizationName: string) => ipcRenderer.invoke('create-project', title, organizationName),
  loadProject: (slug: string) => ipcRenderer.invoke('load-project', slug),
  readProjectFile: <T>(slug: string, fileName: string) => ipcRenderer.invoke('read-project-file', slug, fileName) as Promise<T>,
  writeProjectFile: (slug: string, fileName: string, payload: unknown) => ipcRenderer.invoke('write-project-file', slug, fileName, payload),
  fetchSheetData: (sheetId: string) => ipcRenderer.invoke('fetch-sheet-data', sheetId),
  setPassive: (slug: string, responseId: string, isPassive: boolean) => ipcRenderer.invoke('set-passive', slug, responseId, isPassive),
  importSheet: (slug: string) => ipcRenderer.invoke('import-sheet', slug),
  runAnalysis: (slug: string) => ipcRenderer.invoke('run-analysis', slug),
  exportReport: (slug: string, kind: 'pdf' | 'word' | 'excel') => ipcRenderer.invoke('export-report', slug, kind),
  getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),
  setRecentProject: (slug: string) => ipcRenderer.invoke('set-recent-project', slug),
});
