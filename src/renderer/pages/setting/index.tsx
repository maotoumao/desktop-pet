import { useEffect, useState } from 'react';
import Trianglify from 'trianglify';
import styles from './index.module.css';
import getQuery from '../main/utils/get-query';

export default function Setting() {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    const bkgd = Trianglify({
      width: window.innerWidth,
      height: window.innerHeight,
    })
      // @ts-ignore
      .toCanvas()
      .toDataURL();
    document.body.style.background = `url(${bkgd})`;
    setModels(window.common.getModelList());
    const selMod = getQuery('selectedModel');
    if (selMod) {
      setSelectedModel(selMod);
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      <span className={styles.header}>模型列表</span>
      <div className={styles.container}>
        {models.map((model) => (
          <div
            role="button"
            tabIndex={-1}
            className={styles.modelItem}
            onClick={() => {
              if (selectedModel === model) {
                setSelectedModel(null);
              } else {
                setSelectedModel(model);
              }
            }}
          >
            <div
              className={
                selectedModel === model
                  ? styles.checkedBox
                  : styles.uncheckedBox
              }
            />
            {model}
          </div>
        ))}
      </div>
      <div
        className={styles.button}
        onClick={() => {
          if (selectedModel) {
            window.common.loadModel(selectedModel);
          }
        }}
        tabIndex={-1}
        role="button"
      >
        更换模型😜
      </div>
    </div>
  );
}
