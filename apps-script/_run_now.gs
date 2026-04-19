/**
 * TEMP one-shot runner for CL1. Delete after use.
 */
function runPipelineNow_Maroochydore() {
  const url = 'https://docs.google.com/spreadsheets/d/1KghEIDQarecp57HGqCS2Osz5LcOcn4qBxpXPGc0Z6UQ/edit';
  const result = runPipeline(url);
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
