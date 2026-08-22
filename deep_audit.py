#!/usr/bin/env python3
import re, os
from pathlib import Path

REPO = Path('src')
issues = []

def report(file, line, severity, category, message):
    issues.append({'file': str(file), 'line': line, 'severity': severity, 'category': category, 'message': message})

def extract_hooks(content):
    """Extract useEffect, useCallback, useMemo blocks with their deps."""
    hooks = []
    for match in re.finditer(r'(useEffect|useCallback|useMemo)\s*\(\s*\(([^)]*)\)\s*=>\s*\{', content):
        hook_type = match.group(1)
        start = match.end()
        # Find closing bracket by brace counting
        brace_count = 1
        i = start
        while i < len(content) and brace_count > 0:
            if content[i] == '{': brace_count += 1
            elif content[i] == '}': brace_count -= 1
            i += 1
        body = content[start:i-1]
        # Find dependency array after the body
        rest = content[i:].lstrip()
        dep_match = re.match(r',\s*\[([^\]]*)\]', rest)
        deps = [d.strip() for d in dep_match.group(1).split(',') if d.strip()] if dep_match else None
        hooks.append({
            'type': hook_type,
            'body': body,
            'deps': deps,
            'line': content[:match.start()].count('\n') + 1
        })
    return hooks

def audit_file(f, content):
    hooks = extract_hooks(content)
    lines = content.splitlines()
    
    for hook in hooks:
        body = hook['body']
        deps = hook['deps'] or []
        hook_line = hook['line']
        
        # 1. Check for missing cleanup in useEffect with subscriptions/listeners
        if hook['type'] == 'useEffect':
            has_add = any(kw in body for kw in ['addEventListener', 'IntersectionObserver', 'setTimeout', 'setInterval', 'subscribe'])
            has_remove = any(kw in body for kw in ['removeEventListener', '.disconnect()', 'clearTimeout', 'clearInterval', 'unsubscribe'])
            if has_add and not has_remove:
                report(f, hook_line, 'HIGH', 'Lifecycle', 
                    f'useEffect adds listener/observer/timer but missing cleanup return. Deps: [{", ".join(deps)}]')
        
        # 2. Check for stale closure: variables read in body but not in deps
        # Extract all identifiers used in the body
        body_vars = set(re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\b', body))
        # Filter to likely state/props (capitalized or common patterns)
        likely_state = {v for v in body_vars if v not in {
            'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally',
            'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
            'console', 'window', 'document', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number',
            'Promise', 'Set', 'Map', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent',
            'fetch', 'alert', 'logger', 'supabase', 'localStorage', 'sessionStorage', 'URL', 'Blob', 'FileReader',
            'requestAnimationFrame', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
            'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useParams', 'React',
            'motion', 'AnimatePresence', 'Navigate', 'Link', 'Route', 'Routes', 'HashRouter',
            'COLOR', 'EASE', 'MAX_VISIBLE_SPECS', 'NEW_PRODUCT_WINDOW_DAYS', 'SIGNATURE_THRESHOLD',
            'VIRAL_BANNER_INTERVAL', 'DISCOVERY_PORTAL_OVERSCROLL_THRESHOLD', 'DWELL_SAMPLE_SIZE_MS',
            'MessageCircle', 'ChevronDown', 'X', 'Minus', 'Plus', 'Check', 'Search', 'Loader2', 'AlertCircle',
            'Hairline', 'StatusBadge', 'SquircleButton', 'CatalogProductImage', 'CatalogEmptyState',
            'ScrollPositionIndicator', 'Toast', 'CatalogSkeleton', 'CatalogIdentityStrip',
            'CatalogViralBanner', 'CatalogDiscoveryPortal', 'CatalogDetailSheet', 'CatalogFeedCard',
            'CatalogInquiryTray', 'CatalogUI', 'FadeImage', 'StockStatusBadge', 'SkeletonLoader',
            'PublishSuccess', 'EmptyState', 'ItemDetailSheet', 'ProductCard', 'ErrorBoundary',
            'useStockStatus', 'ai', 'cloudinary', 'compressImage', 'logger', 'stockStatus', 'supabase', 'cn',
            'mapItemToProduct', 'inquiryKey', 'buildInquiryMessage', 'computeIsNew', 'computePresentationTier',
            'imageUrlToBase64', 'suggestProductDetails', 'uploadToCloudinary', 'compressImage',
            'handle', 'el', 'entry', 'item', 'index', 'i', 'j', 'k', 'e', 'event', 'err', 'error', 'data',
            'response', 'result', 'value', 'key', 'id', 'url', 'file', 'blob', 'reader', 'touch', 'delta',
            'max', 'sum', 'price', 'context', 'details', 'patch', 'current', 'prev', 'next', 'state',
            'product', 'products', 'p', 'seller', 'sellerData', 'sellerUuid', 'manageToken', 'shopName',
            'logoUrl', 'sellerPhone', 'phone', 'cleanedPhone', 'validPhone', 'selectedCountry', 'country',
            'items', 'inquiry', 'toastMessage', 'toastVisible', 'query', 'detailProductId', 'detailProduct',
            'activeIndex', 'imageIndices', 'dwellTimes', 'dismissedBanners', 'isOwner', 'isOverlayActive',
            'isAdded', 'isNew', 'isSignature', 'isFiltering', 'showZeroState', 'alternatives', 'filtered',
            'visibleSpecs', 'overflowSpecs', 'specs', 'images', 'safeItems', 'estimatedTotal', 'groups',
            'lines', 'message', 'cleanPhone', 'today', 'now', 'lastViewed', 'viewKey', 't', 'timer',
            'observer', 'startedAt', 'scrollRef', 'feedRef', 'touchStartY', 'writeQueue', 'shopSectionRef',
            'deleteTargetId', 'suggestingId', 'uploading', 'publishing', 'logoUploading', 'saveStatus',
            'inlineError', 'needsPhone', 'profileOpen', 'published', 'canPublish', 'shopIncomplete',
            'isOnline', 'loading', 'error', 'sellerNotFound', 'setItems', 'setSellerPhone', 'setShopName',
            'setLogoUrl', 'setLoading', 'setError', 'setSellerNotFound', 'setIsOwner', 'setActiveIndex',
            'setImageIndices', 'setDwellTimes', 'setDismissedBanners', 'setInquiry', 'setToastVisible',
            'setToastMessage', 'setPortalOpen', 'setQuery', 'setDetailProductId', 'setSaveStatus',
            'setInlineError', 'setNeedsPhone', 'setProfileOpen', 'setPublished', 'setPublishing',
            'setLogoUploading', 'setUploading', 'setSuggestingId', 'setDeleteTargetId', 'setNewItemIds',
            'setSellerPhone', 'setSelectedCountry', 'setPhone', 'setCleanedPhone', 'setValidPhone',
            'setCountryDropdownOpen', 'setShopName', 'setLogoUrl', 'setItems', 'setIsOnline',
            'handle', 'onClose', 'onClick', 'onChange', 'onToggle', 'onRemove', 'onSend', 'onOpenDetail',
            'onDwell', 'onCycleImage', 'onSendWhatsapp', 'onQuantityChange', 'onQueryChange', 'onOpenProduct',
            'handleTouchStart', 'handleTouchMove', 'handleTouchEnd', 'handleToggle', 'handleRemoveInquiry',
            'handleQuantityChange', 'handleDwell', 'cycleImage', 'sendWhatsapp', 'isProductAdded',
            'buildInquiryMessage', 'mapItemToProduct', 'inquiryKey', 'autoSaveShopName', 'autoSavePhone',
            'handleLogo', 'handleRemoveLogo', 'updateItem', 'handleFiles', 'suggest', 'handleDeleteRequest',
            'handleDeleteConfirm', 'publish', 'handlePublish', 'handleUnpublish', 'handleReorder',
            'handleDragStart', 'handleDragOver', 'handleDrop', 'fetchData', 'loadItems',
            'GEMINI_API_KEY', 'GEMINI_API_URL', 'import', 'export', 'default', 'function', 'from', 'as',
            'return', 'throw', 'break', 'continue', 'switch', 'case', 'default', 'do', 'void', 'delete',
            'in', 'of', 'yield', 'await', 'async', 'class', 'extends', 'super', 'static', 'get', 'set',
            'constructor', 'prototype', 'arguments', 'caller', 'callee', 'eval', 'with', 'debugger',
            'package', 'interface', 'implements', 'private', 'protected', 'public', 'abstract', 'final',
            'native', 'synchronized', 'transient', 'volatile', 'strictfp', 'goto', 'const', 'enum',
            'byte', 'short', 'int', 'long', 'float', 'double', 'char', 'boolean', 'auto',
            'template', 'literal', 'string', 'number', 'boolean', 'object', 'symbol', 'bigint',
            'Infinity', 'NaN', 'undefined', 'null', 'true', 'false', 'arguments', 'caller', 'callee',
            'btoa', 'atob', 'escape', 'unescape', 'decodeURI', 'decodeURIComponent', 'encodeURI',
            'isFinite', 'isInteger', 'isSafeInteger', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
            'toString', 'valueOf', 'hasOwnProperty', 'propertyIsEnumerable', 'toLocaleString',
            'bind', 'call', 'apply', 'prototype', 'constructor', 'length', 'name', 'arguments',
            'caller', 'callee', 'source', 'global', 'ignoreCase', 'multiline', 'lastIndex', 'exec',
            'test', 'match', 'search', 'replace', 'split', 'slice', 'substring', 'substr', 'concat',
            'charAt', 'charCodeAt', 'indexOf', 'lastIndexOf', 'trim', 'toLowerCase', 'toUpperCase',
            'toFixed', 'toExponential', 'toPrecision', 'toLocaleString', 'join', 'pop', 'push',
            'reverse', 'shift', 'sort', 'splice', 'unshift', 'every', 'some', 'filter', 'forEach',
            'map', 'reduce', 'reduceRight', 'find', 'findIndex', 'includes', 'flat', 'flatMap',
            'fill', 'copyWithin', 'entries', 'keys', 'values', 'from', 'isArray', 'of', 'abs', 'acos',
            'acosh', 'asin', 'asinh', 'atan', 'atanh', 'atan2', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh',
            'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log1p', 'log10', 'log2',
            'max', 'min', 'pow', 'random', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh',
            'trunc', 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2', 'now', 'parse',
            'UTC', 'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes',
            'getMonth', 'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay',
            'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth',
            'getUTCSeconds', 'getYear', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds',
            'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear',
            'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds',
            'setYear', 'toDateString', 'toGMTString', 'toISOString', 'toJSON', 'toLocaleDateString',
            'toLocaleString', 'toLocaleTimeString', 'toString', 'toTimeString', 'toUTCString', 'now',
            'assign', 'create', 'defineProperties', 'defineProperty', 'freeze', 'getOwnPropertyDescriptor',
            'getOwnPropertyNames', 'getOwnPropertySymbols', 'getPrototypeOf', 'is', 'isExtensible',
            'isFrozen', 'isSealed', 'keys', 'preventExtensions', 'seal', 'setPrototypeOf', 'values',
            'entries', 'fromEntries', 'hasOwn', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
            'toString', 'valueOf', '__defineGetter__', '__defineSetter__', '__lookupGetter__',
            '__lookupSetter__', '__proto__', 'add', 'clear', 'delete', 'entries', 'forEach', 'has',
            'keys', 'values', 'difference', 'intersection', 'isDisjointFrom', 'isSubsetOf', 'isSupersetOf',
            'symmetricDifference', 'union', 'all', 'allSettled', 'any', 'race', 'reject', 'resolve',
            'catch', 'finally', 'then', 'message', 'name', 'stack', 'cause', 'columnNumber', 'fileName',
            'lineNumber', 'number', 'description', 'message', 'name', 'toExponential', 'toFixed',
            'toPrecision', 'toString', 'valueOf', 'anchor', 'big', 'blink', 'bold', 'charAt', 'charCodeAt',
            'codePointAt', 'concat', 'endsWith', 'fixed', 'fontcolor', 'fontsize', 'includes', 'indexOf',
            'italics', 'lastIndexOf', 'link', 'localeCompare', 'match', 'matchAll', 'normalize', 'padEnd',
            'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'slice', 'small', 'split', 'startsWith',
            'strike', 'sub', 'substr', 'substring', 'sup', 'toLocaleLowerCase', 'toLocaleUpperCase',
            'toLowerCase', 'toString', 'toUpperCase', 'trim', 'trimEnd', 'trimStart', 'trimLeft', 'trimRight',
            'valueOf', 'raw', 'fromCharCode', 'fromCodePoint', 'at', 'isWellFormed', 'toWellFormed',
            'iterator', 'species', 'toStringTag', 'hasInstance', 'isConcatSpreadable', 'match', 'replace',
            'search', 'split', 'unscopables', 'asyncIterator', 'dispose', 'asyncDispose', 'metadata',
            'context', 'kind', 'name', 'addInitializer', 'access', 'get', 'set', 'value', 'writable',
            'enumerable', 'configurable', 'get', 'set', 'value', 'writable', 'enumerable', 'configurable',
            'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor', 'getPrototypeOf',
            'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf', 'apply',
            'construct', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'revocable', 'deref', 'transfer', 'transferToFixedLength', 'resize', 'grow', 'slice', 'subarray',
            'set', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes', 'join', 'keys', 'values',
            'entries', 'find', 'findIndex', 'findLast', 'findLastIndex', 'map', 'filter', 'reduce',
            'reduceRight', 'forEach', 'every', 'some', 'fill', 'copyWithin', 'at', 'toReversed', 'toSorted',
            'toSpliced', 'with', 'toLocaleString', 'toString', 'buffer', 'byteLength', 'byteOffset',
            'length', 'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'buffer', 'byteLength', 'byteOffset',
            'length', 'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'next', 'return', 'throw', 'value', 'done',
            'read', 'write', 'close', 'cancel', 'getReader', 'getWriter', 'locked', 'pipeTo', 'pipeThrough',
            'tee', 'reason', 'code', 'message', 'name', 'toString', 'valueOf', 'description', 'flags',
            'dotAll', 'global', 'hasIndices', 'ignoreCase', 'multiline', 'source', 'sticky', 'unicode',
            'unicodeSets', 'compile', 'exec', 'test', 'toString', 'Symbol', 'for', 'keyFor', 'hasInstance',
            'isConcatSpreadable', 'iterator', 'match', 'replace', 'search', 'species', 'split', 'toPrimitive',
            'toStringTag', 'unscopables', 'asyncIterator', 'dispose', 'asyncDispose', 'metadata', 'observable',
            'patternMatch', 'replaceAll', 'metadata', 'context', 'kind', 'name', 'addInitializer', 'access',
            'get', 'set', 'value', 'writable', 'enumerable', 'configurable', 'get', 'set', 'value', 'writable',
            'enumerable', 'configurable', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'apply', 'construct', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'revocable', 'deref', 'transfer', 'transferToFixedLength', 'resize', 'grow', 'slice', 'subarray',
            'set', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes', 'join', 'keys', 'values', 'entries',
            'find', 'findIndex', 'findLast', 'findLastIndex', 'map', 'filter', 'reduce', 'reduceRight',
            'forEach', 'every', 'some', 'fill', 'copyWithin', 'at', 'toReversed', 'toSorted', 'toSpliced',
            'with', 'toLocaleString', 'toString', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'next', 'return', 'throw', 'value', 'done', 'read',
            'write', 'close', 'cancel', 'getReader', 'getWriter', 'locked', 'pipeTo', 'pipeThrough', 'tee',
            'reason', 'code', 'message', 'name', 'toString', 'valueOf', 'description', 'flags', 'dotAll',
            'global', 'hasIndices', 'ignoreCase', 'multiline', 'source', 'sticky', 'unicode', 'unicodeSets',
            'compile', 'exec', 'test', 'toString', 'for', 'keyFor', 'hasInstance', 'isConcatSpreadable',
            'iterator', 'match', 'replace', 'search', 'species', 'split', 'toPrimitive', 'toStringTag',
            'unscopables', 'asyncIterator', 'dispose', 'asyncDispose', 'metadata', 'observable', 'patternMatch',
            'replaceAll', 'metadata', 'context', 'kind', 'name', 'addInitializer', 'access', 'get', 'set',
            'value', 'writable', 'enumerable', 'configurable', 'get', 'set', 'value', 'writable', 'enumerable',
            'configurable', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'apply', 'construct', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'revocable', 'deref', 'transfer', 'transferToFixedLength', 'resize', 'grow', 'slice', 'subarray',
            'set', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes', 'join', 'keys', 'values', 'entries',
            'find', 'findIndex', 'findLast', 'findLastIndex', 'map', 'filter', 'reduce', 'reduceRight',
            'forEach', 'every', 'some', 'fill', 'copyWithin', 'at', 'toReversed', 'toSorted', 'toSpliced',
            'with', 'toLocaleString', 'toString', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'next', 'return', 'throw', 'value', 'done', 'read',
            'write', 'close', 'cancel', 'getReader', 'getWriter', 'locked', 'pipeTo', 'pipeThrough', 'tee',
            'reason', 'code', 'message', 'name', 'toString', 'valueOf', 'description', 'flags', 'dotAll',
            'global', 'hasIndices', 'ignoreCase', 'multiline', 'source', 'sticky', 'unicode', 'unicodeSets',
            'compile', 'exec', 'test', 'toString', 'for', 'keyFor', 'hasInstance', 'isConcatSpreadable',
            'iterator', 'match', 'replace', 'search', 'species', 'split', 'toPrimitive', 'toStringTag',
            'unscopables', 'asyncIterator', 'dispose', 'asyncDispose', 'metadata', 'observable', 'patternMatch',
            'replaceAll', 'metadata', 'context', 'kind', 'name', 'addInitializer', 'access', 'get', 'set',
            'value', 'writable', 'enumerable', 'configurable', 'get', 'set', 'value', 'writable', 'enumerable',
            'configurable', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'apply', 'construct', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'revocable', 'deref', 'transfer', 'transferToFixedLength', 'resize', 'grow', 'slice', 'subarray',
            'set', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes', 'join', 'keys', 'values', 'entries',
            'find', 'findIndex', 'findLast', 'findLastIndex', 'map', 'filter', 'reduce', 'reduceRight',
            'forEach', 'every', 'some', 'fill', 'copyWithin', 'at', 'toReversed', 'toSorted', 'toSpliced',
            'with', 'toLocaleString', 'toString', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'next', 'return', 'throw', 'value', 'done', 'read',
            'write', 'close', 'cancel', 'getReader', 'getWriter', 'locked', 'pipeTo', 'pipeThrough', 'tee',
            'reason', 'code', 'message', 'name', 'toString', 'valueOf', 'description', 'flags', 'dotAll',
            'global', 'hasIndices', 'ignoreCase', 'multiline', 'source', 'sticky', 'unicode', 'unicodeSets',
            'compile', 'exec', 'test', 'toString', 'for', 'keyFor', 'hasInstance', 'isConcatSpreadable',
            'iterator', 'match', 'replace', 'search', 'species', 'split', 'toPrimitive', 'toStringTag',
            'unscopables', 'asyncIterator', 'dispose', 'asyncDispose', 'metadata', 'observable', 'patternMatch',
            'replaceAll', 'metadata', 'context', 'kind', 'name', 'addInitializer', 'access', 'get', 'set',
            'value', 'writable', 'enumerable', 'configurable', 'get', 'set', 'value', 'writable', 'enumerable',
            'configurable', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'apply', 'construct', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor',
            'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf',
            'revocable', 'deref', 'transfer', 'transferToFixedLength', 'resize', 'grow', 'slice', 'subarray',
            'set', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes', 'join', 'keys', 'values', 'entries',
            'find', 'findIndex', 'findLast', 'findLastIndex', 'map', 'filter', 'reduce', 'reduceRight',
            'forEach', 'every', 'some', 'fill', 'copyWithin', 'at', 'toReversed', 'toSorted', 'toSpliced',
            'with', 'toLocaleString', 'toString', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'buffer', 'byteLength', 'byteOffset', 'length',
            'BYTES_PER_ELEMENT', 'name', 'from', 'of', 'next', 'return', 'throw', 'value', 'done', 'read',
            'write', 'close', 'cancel', 'getReader', 'getWriter', 'locked', 'pipeTo', 'pipeThrough', 'tee',
            'reason', 'code', 'message', 'name', 'toString', 'valueOf', 'description', 'flags', 'dotAll',
            'global', 'hasIndices', 'ignoreCase', 'multiline', 'source', 'sticky', 'unicode', 'unicodeSets',
            'compile', 'exec', 'test', 'toString'
        }}
        # Check if variable is in deps but should be
        missing = likely_state - set(deps) - {'undefined', 'null', 'true', 'false'}
        # Remove function names defined in the hook body
        defined_funcs = set(re.findall(r'(?:const|let|var|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:(]', body))
        missing -= defined_funcs
        # Remove common false positives
        missing -= {'e', 'event', 'err', 'error', 'data', 'response', 'result', 'value', 'key', 'id', 'url',
                    'file', 'blob', 'reader', 'touch', 'delta', 'max', 'sum', 'price', 'context', 'details',
                    'patch', 'current', 'prev', 'next', 'state', 'product', 'products', 'p', 'seller',
                    'sellerData', 'sellerUuid', 'manageToken', 'shopName', 'logoUrl', 'sellerPhone', 'phone',
                    'cleanedPhone', 'validPhone', 'selectedCountry', 'country', 'items', 'inquiry',
                    'toastMessage', 'toastVisible', 'query', 'detailProductId', 'detailProduct', 'activeIndex',
                    'imageIndices', 'dwellTimes', 'dismissedBanners', 'isOwner', 'isOverlayActive', 'isAdded',
                    'isNew', 'isSignature', 'isFiltering', 'showZeroState', 'alternatives', 'filtered',
                    'visibleSpecs', 'overflowSpecs', 'specs', 'images', 'safeItems', 'estimatedTotal', 'groups',
                    'lines', 'message', 'cleanPhone', 'today', 'now', 'lastViewed', 'viewKey', 't', 'timer',
                    'observer', 'startedAt', 'scrollRef', 'feedRef', 'touchStartY', 'writeQueue', 'shopSectionRef',
                    'deleteTargetId', 'suggestingId', 'uploading', 'publishing', 'logoUploading', 'saveStatus',
                    'inlineError', 'needsPhone', 'profileOpen', 'published', 'canPublish', 'shopIncomplete',
                    'isOnline', 'loading', 'error', 'sellerNotFound', 'setItems', 'setSellerPhone', 'setShopName',
                    'setLogoUrl', 'setLoading', 'setError', 'setSellerNotFound', 'setIsOwner', 'setActiveIndex',
                    'setImageIndices', 'setDwellTimes', 'setDismissedBanners', 'setInquiry', 'setToastVisible',
                    'setToastMessage', 'setPortalOpen', 'setQuery', 'setDetailProductId', 'setSaveStatus',
                    'setInlineError', 'setNeedsPhone', 'setProfileOpen', 'setPublished', 'setPublishing',
                    'setLogoUploading', 'setUploading', 'setSuggestingId', 'setDeleteTargetId', 'setNewItemIds',
                    'setSellerPhone', 'setSelectedCountry', 'setPhone', 'setCleanedPhone', 'setValidPhone',
                    'setCountryDropdownOpen', 'setShopName', 'setLogoUrl', 'setItems', 'setIsOnline',
                    'handle', 'onClose', 'onClick', 'onChange', 'onToggle', 'onRemove', 'onSend', 'onOpenDetail',
                    'onDwell', 'onCycleImage', 'onSendWhatsapp', 'onQuantityChange', 'onQueryChange', 'onOpenProduct',
                    'handleTouchStart', 'handleTouchMove', 'handleTouchEnd', 'handleToggle', 'handleRemoveInquiry',
                    'handleQuantityChange', 'handleDwell', 'cycleImage', 'sendWhatsapp', 'isProductAdded',
                    'buildInquiryMessage', 'mapItemToProduct', 'inquiryKey', 'autoSaveShopName', 'autoSavePhone',
                    'handleLogo', 'handleRemoveLogo', 'updateItem', 'handleFiles', 'suggest', 'handleDeleteRequest',
                    'handleDeleteConfirm', 'publish', 'handlePublish', 'handleUnpublish', 'handleReorder',
                    'handleDragStart', 'handleDragOver', 'handleDrop', 'fetchData', 'loadItems'}
        if missing:
            report(f, hook_line, 'MEDIUM', 'React', 
                f'{hook["type"]} may have stale closure: variables {missing} used in body but not in deps [{", ".join(deps)}]')

        # 3. Check for setState in loops without functional update
        if 'set' in body and ('.map(' in body or '.forEach(' in body or 'for ' in body):
            if not re.search(r'set\w+\s*\(\s*\(?\s*\w+\s*\)\s*=>', body):
                report(f, hook_line, 'LOW', 'React',
                    f'SetState inside loop without functional update — may use stale state. Deps: [{", ".join(deps)}]')

    # 4. Check for async functions that aren't useCallback but are passed as props
    for i, line in enumerate(lines, 1):
        if 'async function' in line or 'async (' in line:
            # Check if it's inside a component (not top-level)
            func_name = re.search(r'(?:const|let|var)\s+(\w+)\s*=\s*async', line)
            if func_name:
                fname = func_name.group(1)
                # Check if passed as prop
                if f'{fname}=' in content or f'{fname} }}' in content:
                    report(f, i, 'LOW', 'React',
                        f'Async function `{fname}` defined in render — recreate on every render. Wrap in useCallback.')

    # 5. Check for missing error handling on fetch/await at top level
    for i, line in enumerate(lines, 1):
        if 'await ' in line and 'try' not in line:
            context = '\n'.join(lines[max(0,i-5):i+1])
            if 'try' not in context and 'catch' not in context:
                report(f, i, 'MEDIUM', 'Async',
                    'Top-level await without try/catch — unhandled rejection')

    # 6. Check for img without onError or with weak onError
    for i, line in enumerate(lines, 1):
        if '<img' in line and 'onError' not in line:
            report(f, i, 'MEDIUM', 'UX',
                '<img> without onError handler — broken image leaves layout gap')
        elif 'onError=' in line and "style.display = 'none'" in line:
            report(f, i, 'LOW', 'UX',
                'Image onError only hides element — consider placeholder instead')

    # 7. Check for z-index conflicts (multiple fixed elements)
    fixed_elements = [i for i, line in enumerate(lines, 1) if 'fixed' in line and 'z-' in line]
    if len(fixed_elements) > 3:
        report(f, 0, 'MEDIUM', 'Visual',
            f'Multiple fixed positioned elements ({len(fixed_elements)}) — potential z-index stacking conflicts')

    # 8. Check for missing preventDefault on touch handlers that might scroll
    for i, line in enumerate(lines, 1):
        if 'onTouchMove=' in line and 'preventDefault' not in line:
            report(f, i, 'LOW', 'Events',
                'onTouchMove without preventDefault — may cause unwanted scroll')

    # 9. Check for useRef without null checks before use
    for i, line in enumerate(lines, 1):
        if '.current' in line and '?' not in line and 'if (' not in line:
            prev = '\n'.join(lines[max(0,i-3):i])
            if 'if (' not in prev and '?' not in line:
                report(f, i, 'LOW', 'Safety',
                    'Ref access without null guard — may crash if ref is null')

    # 10. Check for event.target usage (synthetic event pooling in React 18+ is gone but still risky)
    for i, line in enumerate(lines, 1):
        if 'event.target' in line or 'e.target' in line:
            if 'persist' not in line and 'currentTarget' not in line:
                report(f, i, 'LOW', 'React',
                    'Using event.target — prefer event.currentTarget for reliability')

# ----------------------------------------------------------------------------
# RUN AUDIT
# ----------------------------------------------------------------------------
for f in sorted(REPO.rglob('*.jsx')) + sorted(REPO.rglob('*.js')):
    if 'node_modules' in str(f): continue
    content = f.read_text()
    audit_file(f, content)

# ----------------------------------------------------------------------------
# OUTPUT
# ----------------------------------------------------------------------------
issues.sort(key=lambda x: (x['severity'] != 'CRITICAL', x['severity'] != 'HIGH', x['severity'] != 'MEDIUM', x['file'], x['line']))

print('=' * 70)
print('DEEP SEMANTIC AUDIT REPORT')
print('=' * 70)
print(f'Total issues found: {len(issues)}')
print()

for sev in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
    sev_issues = [i for i in issues if i['severity'] == sev]
    if sev_issues:
        print(f"\n{'🔴' if sev=='CRITICAL' else '🟠' if sev=='HIGH' else '🟡' if sev=='MEDIUM' else '🟢'} {sev} ({len(sev_issues)} issues)")
        print('-' * 50)
        for issue in sev_issues:
            loc = f"{issue['file']}:{issue['line']}" if issue['line'] else issue['file']
            print(f"  [{issue['category']}] {loc}")
            print(f"    → {issue['message']}")

print('\n' + '=' * 70)
print('END OF DEEP AUDIT')
