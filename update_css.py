with open('src/index.css', 'r') as f:
    content = f.read()

# Add v0 CSS variables after our existing :root block
old_root_end = """    --color-brand-blue: #2563eb;
    }
}"""

new_root_end = """    --color-brand-blue: #2563eb;

    /* v0 design system */
    --background: #faf7f2;
    --foreground: #1c1917;
    --card: #ffffff;
    --card-foreground: #1c1917;
    --popover: #ffffff;
    --popover-foreground: #1c1917;
    --primary: #c65f3e;
    --primary-foreground: #ffffff;
    --secondary: #f5f5f4;
    --secondary-foreground: #1c1917;
    --muted: #f5f5f4;
    --muted-foreground: #78716c;
    --accent: #f5f5f4;
    --accent-foreground: #1c1917;
    --destructive: #b91c1c;
    --border: #e7e5e4;
    --input: #e7e5e4;
    --ring: #c65f3e;
    --radius: 0.625rem;
    }
}"""

content = content.replace(old_root_end, new_root_end)

# Add v0 animations after existing animations
old_anim_end = """.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}"""

new_anim_end = """.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* v0 animations */
@keyframes infini-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes infini-shimmer {
  from {
    background-position: -200% 0;
  }
  to {
    background-position: 200% 0;
  }
}

.animate-rise {
  opacity: 0;
  animation: infini-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.shimmer {
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: infini-shimmer 1.1s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-rise {
    opacity: 1;
    transform: none;
    animation: none;
  }
  .shimmer {
    animation: none;
  }
}"""

content = content.replace(old_anim_end, new_anim_end)

with open('src/index.css', 'w') as f:
    f.write(content)

print('SUCCESS')
