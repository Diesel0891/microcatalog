with open('tailwind.config.js', 'r') as f:
    content = f.read()

# Find the colors block and add v0 colors after the sage block
old_colors = """        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c7d9c7',
          300: '#9ebf9e',
          400: '#729f72',
          500: '#528252',
          600: '#3f663f',
          700: '#345234',
          800: '#2b412b',
          900: '#243624',
          950: '#111e11',
        },
      },"""

new_colors = """        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c7d9c7',
          300: '#9ebf9e',
          400: '#729f72',
          500: '#528252',
          600: '#3f663f',
          700: '#345234',
          800: '#2b412b',
          900: '#243624',
          950: '#111e11',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },"""

content = content.replace(old_colors, new_colors)

# Add group-active variant
old_theme_end = """      lineHeight: {
        'tight': '1.2',
        'snug': '1.35',
        'normal': '1.5',
        'relaxed': '1.65',
      },
    },
  },"""

new_theme_end = """      lineHeight: {
        'tight': '1.2',
        'snug': '1.35',
        'normal': '1.5',
        'relaxed': '1.65',
      },
    },
  },
  variants: {
    extend: {
      translate: ['group-active'],
      scale: ['group-active'],
    },
  },"""

content = content.replace(old_theme_end, new_theme_end)

with open('tailwind.config.js', 'w') as f:
    f.write(content)

print('SUCCESS')
