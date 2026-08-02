import { useCallback, useEffect, useState } from "react";

export interface AIConfig {
  provider: string;
  apiKey: string;
  modelName: string;
  endpoint: string;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: "openai",
  apiKey: "",
  modelName: "gpt-4",
  endpoint: "https://api.openai.com/v1",
};

export function useAIConfig() {
  const [config, setConfigState] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await window.electron.settings.getAIConfig();
      if (stored) setConfigState({ ...DEFAULT_CONFIG, ...stored });
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (next: AIConfig) => {
    setConfigState(next);
    await window.electron.settings.setAIConfig(next);
  }, []);

  return { config, loaded, save };
}
