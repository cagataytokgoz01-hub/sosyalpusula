export const writeJsonFile = <T,>(projectSlug: string, fileName: string, payload: T) =>
  window.sociometryApi.writeProjectFile(projectSlug, fileName, payload);
