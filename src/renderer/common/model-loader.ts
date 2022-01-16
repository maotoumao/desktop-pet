async function loadModel(modelName: string): Promise<Common.IModelInfo> {
  const rawconfig: any = await window.fs.readFile(
    window.common.getAssets('models', modelName, 'model.json'),
    {
      encoding: 'utf-8',
    }
  );
  let config;
  try {
    config = JSON.parse(rawconfig);
  } catch {
    config = {};
  }
  const modelPath = window.common.getAssets(
    'models',
    modelName,
    config.entry ?? ''
  );

  return {
    config,
    modelPath,
  };
}

export { loadModel };
