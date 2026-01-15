import {
  createSystem,
  defaultConfig,
  defineTokens,
  defineTextStyles,
  defineRecipe,
} from '@chakra-ui/react'

const tokens = defineTokens({
  colors: {
    brand: {
      50: { value: '#eef2ff' },
      100: { value: '#e0e7ff' },
      200: { value: '#c7d2fe' },
      300: { value: '#a5b4fc' },
      400: { value: '#818cf8' },
      500: { value: '#6366f1' },
      600: { value: '#4f46e5' },
      700: { value: '#4338ca' },
      800: { value: '#3730a3' },
      900: { value: '#312e81' },
    },
    ocean: {
      50: { value: '#ecfeff' },
      100: { value: '#cffafe' },
      200: { value: '#a5f3fc' },
      300: { value: '#67e8f9' },
      400: { value: '#22d3ee' },
      500: { value: '#06b6d4' },
      600: { value: '#0891b2' },
      700: { value: '#0e7490' },
      800: { value: '#155e75' },
      900: { value: '#164e63' },
    },
    slate: {
      25: { value: '#f8fafc' },
      50: { value: '#f4f6fb' },
      100: { value: '#e2e8f0' },
      200: { value: '#cbd5f5' },
      300: { value: '#94a3b8' },
      400: { value: '#64748b' },
      500: { value: '#475569' },
      600: { value: '#334155' },
      700: { value: '#1e293b' },
      800: { value: '#0f172a' },
    },
    surface: {
      50: { value: '#f5f7fb' },
      100: { value: '#ffffff' },
      200: { value: '#eef1ff' },
    },
    text: {
      base: { value: '#0f172a' },
      muted: { value: '#465165' },
      subtle: { value: '#6b7280' },
    },
    border: {
      subtle: { value: 'rgba(15, 23, 42, 0.08)' },
      strong: { value: 'rgba(15, 23, 42, 0.18)' },
    },
  },
  fonts: {
    heading: { value: '"Space Grotesk", "Inter", system-ui, sans-serif' },
    body: { value: '"Inter", "Space Grotesk", system-ui, sans-serif' },
    mono: { value: '"JetBrains Mono", "SFMono-Regular", monospace' },
  },
  radii: {
    xl: { value: '1.25rem' },
    '2xl': { value: '1.75rem' },
    pill: { value: '999px' },
  },
  spacing: {
    gutter: { value: '1.75rem' },
    section: { value: '3.5rem' },
    columnGap: { value: '1.25rem' },
  },
})

const textStyles = defineTextStyles({
  hero: {
    value: {
      fontFamily: 'fonts.heading',
      fontWeight: '600',
      letterSpacing: '-0.02em',
      lineHeight: '1.1',
      fontSize: {
        base: '2.25rem',
        md: '3rem',
      },
    },
  },
  eyebrow: {
    value: {
      fontFamily: 'fonts.body',
      fontSize: '0.75rem',
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      fontWeight: '600',
      color: 'colors.text.subtle',
    },
  },
})

const buttonRecipe = defineRecipe({
  className: 'tb-button',
  base: {
    borderRadius: 'pill',
    fontWeight: '600',
    letterSpacing: '0.01em',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    _focusVisible: {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.45)',
    },
    _icon: {
      color: 'currentColor',
    },
  },
  variants: {
    variant: {
      solid: {
        bg: 'colorPalette.solid',
        color: 'colorPalette.contrast',
        _hover: {
          bg: 'colorPalette.solid/90',
          transform: 'translateY(-1px)',
          boxShadow: '0px 18px 35px rgba(79, 70, 229, 0.18)',
        },
        _active: {
          bg: 'colorPalette.solid/80',
          transform: 'translateY(0)',
        },
      },
      outline: {
        borderWidth: '1px',
        borderColor: 'colorPalette.border',
        color: 'colorPalette.fg',
        _hover: {
          bg: 'colorPalette.subtle',
          color: 'colorPalette.fg',
        },
      },
      ghost: {
        bg: 'transparent',
        color: 'colorPalette.fg',
        _hover: {
          bg: 'colorPalette.subtle',
        },
      },
    },
    size: {
      sm: {
        h: '9',
        px: '4',
      },
      md: {
        h: '11',
        px: '5',
      },
      lg: {
        h: '12',
        px: '6',
        fontSize: '1rem',
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
})

const badgeRecipe = defineRecipe({
  className: 'tb-badge',
  base: {
    borderRadius: 'pill',
    fontWeight: '600',
    textTransform: 'none',
    letterSpacing: '0.02em',
    px: '3',
    py: '1',
  },
  variants: {
    variant: {
      subtle: {
        bg: 'colorPalette.subtle',
        color: 'colorPalette.fg',
      },
      solid: {
        bg: 'colorPalette.solid',
        color: 'colorPalette.contrast',
      },
      outline: {
        borderWidth: '1px',
        borderColor: 'colorPalette.border',
        color: 'colorPalette.fg',
      },
    },
  },
  defaultVariants: {
    variant: 'subtle',
  },
})

export const theme = createSystem(defaultConfig, {
  theme: {
    tokens,
    textStyles,
    recipes: {
      button: buttonRecipe,
      badge: badgeRecipe,
    },
  },
  globalCss: {
    ':where(html, body)': {
      backgroundColor: 'colors.surface.50',
      color: 'colors.text.base',
      fontFamily: 'fonts.body',
      minHeight: '100%',
      margin: 0,
    },
    body: {
      backgroundColor: 'colors.surface.50',
      color: 'colors.text.base',
      minHeight: '100vh',
    },
    '#root': {
      minHeight: '100vh',
    },
    '::selection': {
      backgroundColor: 'colors.brand.200',
      color: 'colors.brand.900',
    },
  },
})
