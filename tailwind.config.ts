// tailwind.config.js
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', ...defaultTheme.fontFamily.sans],
      },
    },
  },
}