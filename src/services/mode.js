/** Pages should import resource services, never this mode switch directly. */
export const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
export const choose = (mockAction, apiAction) => (...args) => useMock ? Promise.resolve().then(() => mockAction(...args)) : apiAction(...args);
