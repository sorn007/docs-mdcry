// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    auth: {
      sessionTtlSeconds: 60 * 60 * 24 * 14
    },
    docs: {
      rootPrefix: ''
    },
    s3: {
      endpoint: '',
      region: 'auto',
      accessKeyId: '',
      secretAccessKey: '',
      bucket: ''
    }
  },

  nitro: {
    externals: {
      external: [
        '@prisma/client',
        '@prisma/adapter-better-sqlite3',
        'better-sqlite3'
      ]
    }
  },

  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        plugins: []
      }
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
