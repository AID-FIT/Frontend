import { useCallback, useState } from 'react';

export function useToggleList(initialValues: string[] = []) {
  const [values, setValues] = useState<string[]>(initialValues);

  const toggle = useCallback((value: string) => {
    setValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }, []);

  return { values, toggle, setValues };
}
