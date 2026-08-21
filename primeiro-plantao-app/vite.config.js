import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Porta fixa em 5177 para não brigar com o Rohy, que roda em 5173.
export default defineConfig({
  plugins: [react()],
  server: { port: 5177, strictPort: true },
});
