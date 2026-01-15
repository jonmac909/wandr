export const debug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export const debugWarn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};
