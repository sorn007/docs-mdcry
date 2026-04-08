// https://nuxt.com/docs/api/configuration/nuxt-config

const securityHeaders: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
  // Nuxt/Vue need inline scripts; tighten further if you add nonces.
  'content-security-policy': [
    'default-src \'self\'',
    'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'',
    'style-src \'self\' \'unsafe-inline\'',
    'img-src \'self\' data: https: blob:',
    'font-src \'self\' data:',
    'connect-src \'self\'',
    'frame-ancestors \'none\'',
    'base-uri \'self\'',
    'form-action \'self\''
  ].join('; ')
}

if (process.env.NUXT_SECURITY_HSTS === 'true') {
  securityHeaders['strict-transport-security'] = 'max-age=31536000; includeSubDomains'
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: process.env.NODE_ENV !== 'production'
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    auth: {
      sessionTtlSeconds: 60 * 60 * 24 * 14
    },
    docs: {
      rootPrefix: ''
    },
    rateLimit: {
      trustProxy: false
    },
    s3: {
      endpoint: '',
      region: 'auto',
      accessKeyId: '',
      secretAccessKey: '',
      bucket: ''
    }
  },

  routeRules: {
    '/**': {
      headers: securityHeaders
    }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    externals: {
      external: [
        '@prisma/client',
        '@prisma/adapter-pg',
        'pg'
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

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
