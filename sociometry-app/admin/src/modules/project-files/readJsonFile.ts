export const readJsonFile = <T,>(projectSlug: string, fileName: string) =>
  window.sociometryApi.readProjectFile<T>(projectSlug, fileName);
