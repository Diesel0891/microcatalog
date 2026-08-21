path = 'src/components/CatalogInquiryTray.jsx'
with open(path, 'r') as f:
  content = f.read()

# Fix 1+6: Increase tray height, flex column, sticky header, scrollable body
content = content.replace(
  '            <div className="max-h-64 overflow-y-auto px-4 py-3 pb-32">',
  '            <div className="max-h-[50vh] flex flex-col">'
)

content = content.replace(
  '                <div className="pb-2">',
  '                <div className="shrink-0 px-4 pt-3 pb-2">'
)

content = content.replace(
  '              <div className="flex flex-col gap-3">',
  '              <div className="flex-1 overflow-y-auto px-4 pb-32">\n                <div className="flex flex-col gap-3">'
)

content = content.replace(
  '              </div>\n            </div>\n          </div>',
  '              </div>\n              </div>\n            </div>\n          </div>'
)

with open(path, 'w') as f:
  f.write(content)

with open(path, 'r') as f:
  v = f.read()
assert 'max-h-[50vh] flex flex-col' in v
assert 'shrink-0 px-4 pt-3 pb-2' in v
assert 'flex-1 overflow-y-auto px-4 pb-32' in v
print('CatalogInquiryTray.jsx: OK')
