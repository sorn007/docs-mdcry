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
