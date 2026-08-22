#!/usr/bin/env python3
import os, re, json
from pathlib import Path

REPO = Path('.')
SEVERITY = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡', 'LOW': '🟢'}

issues = []

def report(file, line, severity, category, message):
    issues.append({
        'file': str(file),
        'line': line,
        'severity': severity,
        'category': category,
        'message': message
    })

# ----------------------------------------------------------------------------
# SCAN ALL JSX/JS FILES
# ----------------------------------------------------------------------------
for f in sorted(REPO.rglob('*.jsx')) + sorted(REPO.rglob('*.js')):
    if 'node_modules' in str(f): continue
    lines = f.read_text().splitlines()
    content = '\n'.join(lines)

    # A. React Lifecycle & Hooks
    # A1: useEffect without cleanup that adds listeners
    for i, line in enumerate(lines, 1):
        if 'addEventListener' in line and 'useEffect' not in line:
            # Check if there's a cleanup in the same useEffect block
            report(f, i, 'HIGH', 'Lifecycle', 'addEventListener without visible cleanup — potential memory leak')

    # A2: setTimeout/setInterval without clear
    timeout_matches = list(re.finditer(r'setTimeout|setInterval', content))
    clear_matches = list(re.finditer(r'clearTimeout|clearInterval', content))
    if len(timeout_matches) > len(clear_matches):
        report(f, 0, 'MEDIUM', 'Lifecycle', f'More setTimeout/Interval ({len(timeout_matches)}) than clears ({len(clear_matches)}) — potential leak')

    # A3: IntersectionObserver without disconnect
    if 'new IntersectionObserver' in content and '.disconnect()' not in content:
        report(f, 0, 'HIGH', 'Lifecycle', 'IntersectionObserver created but .disconnect() not found — memory leak')

    # B. State & Data Bugs
    # B1: localStorage without try/catch
    for i, line in enumerate(lines, 1):
        if 'localStorage.' in line and 'try' not in line and 'catch' not in line:
            # Check surrounding context
            context = '\n'.join(lines[max(0,i-3):i+1])
            if 'try' not in context:
                report(f, i, 'MEDIUM', 'Data', 'localStorage access without try/catch — crashes in private mode')

    # B2: sessionStorage without try/catch
    for i, line in enumerate(lines, 1):
        if 'sessionStorage.' in line and 'try' not in line and 'catch' not in line:
            context = '\n'.join(lines[max(0,i-3):i+1])
            if 'try' not in context:
                report(f, i, 'MEDIUM', 'Data', 'sessionStorage access without try/catch')

    # B3: JSON.parse without try/catch
    for i, line in enumerate(lines, 1):
        if 'JSON.parse' in line:
            context = '\n'.join(lines[max(0,i-3):i+1])
            if 'try' not in context:
                report(f, i, 'HIGH', 'Data', 'JSON.parse without try/catch — will crash on corrupt data')

    # C. Event & Touch
    # C1: onClick on nested elements without stopPropagation check
    if 'onClick' in content and 'stopPropagation' not in content:
        report(f, 0, 'LOW', 'Events', 'File has onClick handlers but no stopPropagation — possible event bubbling issues')

    # C2: Missing aria-label on interactive elements
    for i, line in enumerate(lines, 1):
        if ('onClick=' in line or 'onTouchStart=' in line) and 'aria-label' not in line and 'button' not in line.lower():
            report(f, i, 'LOW', 'A11y', 'Interactive element missing aria-label')

    # D. Visual/Layout
    # D1: backdrop-filter in animated component (motion budget violation)
    for i, line in enumerate(lines, 1):
        if 'backdrop-filter' in line or 'backdropFilter' in line:
            report(f, i, 'HIGH', 'Visual', 'backdrop-filter found — forbidden during animation per motion budget, causes compositing artifacts')

    # D2: filter: blur in animated component
    for i, line in enumerate(lines, 1):
        if 'filter:' in line and 'blur' in line:
            report(f, i, 'HIGH', 'Visual', 'filter: blur() found — forbidden during animation per motion budget')

    # D3: box-shadow in transition/animation
    for i, line in enumerate(lines, 1):
        if 'box-shadow' in line and ('transition' in line or 'animate' in line):
            report(f, i, 'MEDIUM', 'Visual', 'box-shadow animated — performance risk on A03')

    # D4: Fixed positioning without z-index check
    for i, line in enumerate(lines, 1):
        if 'fixed' in line and 'z-' not in line:
            report(f, i, 'MEDIUM', 'Visual', 'position: fixed without explicit z-index — may render behind other elements')

    # E. Security
    # E1: dangerouslySetInnerHTML
    if 'dangerouslySetInnerHTML' in content:
        report(f, 0, 'CRITICAL', 'Security', 'dangerouslySetInnerHTML detected — XSS risk')

    # E2: window.open without noopener
    for i, line in enumerate(lines, 1):
        if 'window.open' in line and 'noopener' not in line:
            report(f, i, 'HIGH', 'Security', 'window.open without noopener — tabnabbing risk')

    # F. Performance
    # F1: Inline object/array in render (causes re-render)
    for i, line in enumerate(lines, 1):
        if 'style={{' in line and ('{}' in line or '[]' in line):
            report(f, i, 'LOW', 'Perf', 'Empty inline object/array in JSX — causes unnecessary re-renders')

    # F2: No useMemo on expensive computations
    if '.reduce(' in content and 'useMemo' not in content:
        report(f, 0, 'LOW', 'Perf', 'Array.reduce in render without useMemo — recomputes every render')

    # G. Async & Race Conditions
    # G1: Fire-and-forget async without error handling
    for i, line in enumerate(lines, 1):
        if 'void (async ()' in line or 'void(async ()' in line:
            report(f, i, 'MEDIUM', 'Async', 'Fire-and-forget async with void wrapper — errors silently swallowed')

    # G2: State update after await without cancellation check
    for i, line in enumerate(lines, 1):
        if 'await ' in line:
            # Check if component is still mounted before state update
            next_lines = '\n'.join(lines[i:min(i+5, len(lines))])
            if 'set' in next_lines and 'mounted' not in content and 'isMounted' not in content:
                report(f, i, 'LOW', 'Async', 'State update after await without mount guard — potential setState on unmounted component')

    # H. Prop & API Contract
    # H1: Optional chaining on potentially undefined
    for i, line in enumerate(lines, 1):
        if '?.' in line and '||' not in line and '??' not in line:
            # Just flag heavy use
            pass

    # H2: Missing key in map
    for i, line in enumerate(lines, 1):
        if '.map(' in line:
            # Check next few lines for key=
            next_block = '\n'.join(lines[i:min(i+8, len(lines))])
            if 'key=' not in next_block:
                report(f, i, 'CRITICAL', 'React', '.map() without key prop — React will re-render entire list')

    # I. Specific to this codebase
    # I1: alert() calls (should be banned)
    if 'alert(' in content:
        report(f, 0, 'CRITICAL', 'UX', 'alert() call found — must use inline banners per dev standards')

    # I2: sed -i usage (should be banned)
    if 'sed -i' in content:
        report(f, 0, 'CRITICAL', 'DevStd', 'sed -i found in codebase — permanently banned per handoff')

    # I3: Debug instrumentation
    if 'console.log' in content or 'console.warn' in content:
        report(f, 0, 'LOW', 'DevStd', 'console.log/warn found — should use logger.js')

    # I4: Hardcoded colors not using COLOR object
    for i, line in enumerate(lines, 1):
        if re.search(r'#[0-9A-Fa-f]{6}', line) and 'COLOR.' not in line:
            # Allow specific exceptions
            if 'F0EDE4' not in line and '1A1A1A' not in line and '000000' not in line:
                report(f, i, 'LOW', 'Visual', 'Hardcoded hex color not using COLOR token — breaks theme consistency')

# ----------------------------------------------------------------------------
# OUTPUT
# ----------------------------------------------------------------------------
issues.sort(key=lambda x: (x['severity'] != 'CRITICAL', x['severity'] != 'HIGH', x['severity'] != 'MEDIUM', x['file'], x['line']))

print('=' * 70)
print('MICROCATALOG CODEBASE AUDIT REPORT')
print('=' * 70)
print(f'Total issues found: {len(issues)}')
print()

for sev in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
    sev_issues = [i for i in issues if i['severity'] == sev]
    if sev_issues:
        print(f"\n{SEVERITY[sev]} {sev} ({len(sev_issues)} issues)")
        print('-' * 50)
        for issue in sev_issues:
            loc = f"{issue['file']}:{issue['line']}" if issue['line'] else issue['file']
            print(f"  [{issue['category']}] {loc}")
            print(f"    → {issue['message']}")

print('\n' + '=' * 70)
print('END OF AUDIT')
