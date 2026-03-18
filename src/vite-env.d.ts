/// <reference types="vite/client" />

// Tipagem mínima para garantir que `import.meta.env.VITE_*` exista durante o `tsc`.
// O `vite/client` já adiciona `ImportMetaEnv`, mas este arquivo força o `reference types`
// quando rodamos `tsc` diretamente no build.

