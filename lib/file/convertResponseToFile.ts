export async function convertResponseToFile({
  fileType,
  response,
  fileName
}: {
  fileName: string;
  response: Response;
  fileType: string;
}) {
  const buffer = await response.arrayBuffer();
  const blob = new Blob([buffer], { type: fileType });
  const file = new File([blob], fileName, { type: fileType });
  return file;
}
