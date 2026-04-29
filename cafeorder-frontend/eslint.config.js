
//Bu dosya bir ESLint konfigürasyon dosyasý ve kod kalitesini kontrol etmek için kullanýlýr.


//“Konfigürasyon dosyasý” (configuration file), bir programýn nasýl çalýþacaðýný belirleyen ayar dosyasýdýr. 

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
