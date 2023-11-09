document.openrpadebug = false;
document.openrpauniquexpathids = ['ng-model', 'ng-reflect-name']; // aria-label

class DOMUtils {
    static isDebug = false;
    static iframeDisabled = false;
    static coordinatesOffset = { depth: 0, x: 0, y: 0 };

    static isElementVisibleToUser(elem) {
        //Element has dimentions
        if (elem.offsetWidth === 0 || elem.offsetHeight === 0) return false;

        const bcr = elem.getBoundingClientRect();

        //Element is vertically out of screen
        //const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        if (bcr.bottom < 0 || bcr.top - window.innerHeight >= 0) return false;

        //Element is horizontally out of screen
        //const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
        if (bcr.right < 0 || bcr.left - window.innerWidth >= 0) return false;

        const isCenterVisible = elem === this.elementFromPoint((bcr.left + bcr.right) / 2, (bcr.top + bcr.bottom) / 2);
        if (isCenterVisible) return true;
        const isTopLeftVisible = elem === this.elementFromPoint(bcr.left, bcr.top);
        if (isTopLeftVisible) return true;
        const isTopRightVisible = elem === this.elementFromPoint(bcr.right - 1, bcr.top);
        if (isTopRightVisible) return true;
        const isBottomLeftVisible = elem === this.elementFromPoint(bcr.left, bcr.bottom - 1);
        if (isBottomLeftVisible) return true;
        const isBottomRightVisible = elem === this.elementFromPoint(bcr.right - 1, bcr.bottom - 1);
        if (isBottomRightVisible) return true;
        return false;
    };

    static elementFromPoint(x, y) {
        const elems = document.elementsFromPoint(x, y);
        const vpWidth = DOMUtils.getViewPortWidth();
        const vpHeight = DOMUtils.getViewPortHeight();
        if (elems?.length > 0) {
            for (const element of elems) {
                const elem = element;
                const isPluginModalLayer = elem.id === 'chromium-plugin-modal-layer';
                const isModalLayer = elem.offsetWidth === vpWidth
                    && elem.offsetHeight === vpHeight
                    && window.getComputedStyle(elem)["z-index"] !== 'auto';
                if (!isPluginModalLayer && !isModalLayer)
                    return elem;
            }
        }
        return null;
    };

    static getViewPortWidth() { return Math.max(document?.documentElement?.clientWidth || 0, window?.innerWidth || 0); };

    static getViewPortHeight() { return Math.max(document?.documentElement?.clientHeight || 0, window?.innerHeight || 0); };

    static inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    static getAllSubFrames() {
        return document.querySelectorAll('iframe, frame');
    }

    static notifyOffsetToSubFrames() {
        const frames = DOMUtils.getAllSubFrames();
        for (const frame of frames) {
            const msg = {
                functionName: 'notifyFrameOffset',
                depth: DOMUtils.coordinatesOffset.depth + 1
            };
            try {
                openrpautil.applyPhysicalCords(msg, frame);
                msg.x += DOMUtils.coordinatesOffset.x;
                msg.y += DOMUtils.coordinatesOffset.y;
                frame.contentWindow.postMessage(msg, '*');
            } catch (e) {
                console.error(e);
            }
        }
    }

    static computeFrameOffset(win, dims) {
        if (typeof dims === 'undefined') {
            dims = { top: 0, left: 0 };
        }

        let frames = win.parent.document.getElementsByTagName('iframe');
        let frame;
        let found = false;

        for (let i = 0, len = frames.length; i < len; i++) {
            frame = frames[i];
            if (frame.contentWindow == win) {
                found = true;
                break;
            }
        }

        if (found) {
            let rect = frame.getBoundingClientRect();
            dims.left += Math.round(rect.left, 0);
            dims.top += Math.round(rect.top, 0);
            if (win !== top) {
                DOMUtils.computeFrameOffset(win.parent, dims);
            }
        }

        return dims;
    };
}

function getAllShadowRoots(element) {
    const shadowRoots = [];
    
    // Check if the element has a shadow root
    if (element.shadowRoot) {
        shadowRoots.push(element.shadowRoot);
        shadowRoots.push(...getAllShadowRoots(element.shadowRoot))
    }
  
    // Traverse the child nodes recursively
    const childNodes = element.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        
      if (child.nodeType === Node.ELEMENT_NODE) {
        shadowRoots.push(...getAllShadowRoots(child)); // Recursively check for shadow roots in the child element
      }
    }

    return shadowRoots;
}

class ContentListenerProxy {
    documentOnScroll() {
        DOMUtils.notifyOffsetToSubFrames();
    }

    init() {
        this.register();
    }

    register() {
        document.addEventListener("scroll", this.documentOnScroll, false);
    }

    unregister() {
        document.removeEventListener("scroll", this.documentOnScroll, false);
    }
}

document.contentListenerProxy = new ContentListenerProxy();
document.contentListenerProxy.init();

if (true == false) {
    console.debug('skip declaring openrpautil class');
    document.openrpautil = {};
} else {
    if (window.openrpautil_contentlistner === null || window.openrpautil_contentlistner === undefined) {

        function remotePushEvent(evt) {
            if (evt.data != null && evt.data.functionName == "mousemove") {
                openrpautil.parent = evt.data;
                try {
                    notifyFrames();
                } catch (e) { }
            }
        }

        function notifyFrameOffset(event) {
            if (DOMUtils.inIframe() && event?.data?.functionName === 'notifyFrameOffset' && (event.data.depth || 0) < 2) {
                DOMUtils.coordinatesOffset = event.data;
                if (DOMUtils.isDebug) console.debug(event);
                DOMUtils.notifyOffsetToSubFrames();
            }
        }

        function onMessage(event) {
            remotePushEvent(event);
            notifyFrameOffset(event);
        }

        if (window.addEventListener) {
            window.addEventListener("message", onMessage, false);
        } else {
            window.attachEvent("onmessage", onMessage);
        }
        const notifyFrames = (event) => {
            for (let targetElement of document.getElementsByTagName('iframe')) {
                let message = { functionName: 'mousemove', parents: 0, xpaths: [] };
                try {
                    openrpautil.applyPhysicalCords(message, targetElement);
                } catch (e) {
                    console.error(e);
                }
                if (openrpautil.parent != null) {
                    message.parents = openrpautil.parent.parents + 1;
                    message.uix += openrpautil.parent.uix;
                    message.uiy += openrpautil.parent.uiy;
                }
                let width = getComputedStyle(targetElement, null).getPropertyValue('border-width');
                width = parseInt(width.replace('px', '')) * 0.85;
                message.uix += (width | 0);
                let height = getComputedStyle(targetElement, null).getPropertyValue('border-height');
                height = parseInt(height.replace('px', '')) * 0.85;
                message.uiy += (height | 0);

                message.cssPath = UTILS.cssPath(targetElement, false);
                message.xPath = UTILS.xPath(targetElement, true);
                //console.log('postMessage to', targetElement, { uix: message.uix, uiy: message.uiy });
                targetElement.contentWindow.postMessage(message, '*');
            }
            const doFrames = () => {
                try {
                    for (let targetElement of document.getElementsByTagName('frame')) {
                        let message = { functionName: 'mousemove', parents: 0, xpaths: [] };
                        try {
                            openrpautil.applyPhysicalCords(message, targetElement);
                        } catch (e) {
                            console.error(e);
                        }
                        if (openrpautil.parent != null) {
                            message.parents = openrpautil.parent.parents + 1;
                            message.uix += openrpautil.parent.uix;
                            message.uiy += openrpautil.parent.uiy;
                        }
                        let width = getComputedStyle(targetElement, null).getPropertyValue('border-width');
                        width = parseInt(width.replace('px', '')) * 0.85;
                        message.uix += width;
                        let height = getComputedStyle(targetElement, null).getPropertyValue('border-height');
                        height = parseInt(height.replace('px', '')) * 0.85;
                        message.uiy += (height | 0);

                        message.cssPath = UTILS.cssPath(targetElement, false);
                        message.xPath = UTILS.xPath(targetElement, true);
                        targetElement.contentDocument.openrpautil.parent = message;
                    }
                } catch (e) {
                    setTimeout(doFrames, 500);
                }
            };
            doFrames();
        }
        if (!document.URL.startsWith("https://docs.google.com/spreadsheets/d")) {
            window.addEventListener('load', notifyFrames);
        } else {
            console.log("skip google docs");
        }


        const runtimeOnMessage = function (sender, message, fnResponse) {
            try {
                if (openrpautil == undefined) return;
                let func = openrpautil[sender.functionName];
                if (func) {
                    let result = func(sender);
                    if (result == null) {
                        console.warn(sender.functionName + " gave no result.");
                        fnResponse(sender);
                    } else {
                        fnResponse(result);
                    }
                }
                else {
                    sender.error = "Unknown function " + sender.functionName;
                    fnResponse(sender);
                }
            } catch (e) {
                console.error('chrome.runtime.onMessage: error ');
                console.error(e);
                sender.error = e;
                fnResponse(sender);
            }
        }
        chrome.runtime.onMessage.addListener(runtimeOnMessage);
        window.openrpautil_contentlistner = true;
        if (typeof document.openrpautil === 'undefined') {
            document.openrpautil = {};
            var host = chrome;
            var isTabFocused = true;
            var intervalId;
            var last_mousemove = null;
            var cache = {};
            var cachecount = 0;
            var KEYCODE_TAB = 9;
            var KEYCODE_ENTER = 13;
            var ctrlDown = false,
                ctrlKey = 17,
                cmdKey = 91,
                vKey = 86,
                cKey = 67;
            var inputTypes = ['text', 'textarea', 'select', 'radio', 'checkbox', 'search', 'tel', 'url', 'number', 'range', 'email', 'password', 'date', 'month', 'week', 'time', 'datetime-local', 'month', 'color', 'file'];
            const handleChange = (e) => {
                if (inputTypes.some(i => i === e.target.type)) {
                    openrpautil.pushEvent('change', e);
                }
            }
            var openrpautil = {
                parent: null,
                runningVersion: null,
                ping: function () {
                    return "pong";
                },

                init: function () {
                    console.info('IBM Task Mining plugin registered on ' + window?.self?.location?.href);

                    if (document.URL.startsWith("https://docs.google.com/spreadsheets/d")) {
                        console.log("skip google docs *");
                        return;
                    }

                    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

                    let iframeObserver = new MutationObserver(function (mutations, observer) {
                        if (document.onmousemove == null) {
                            console.log('registered again because was not correctly registred (probably an iframe)');
                            openrpautil.init();
                        }
                    });

                    iframeObserver.observe(document, {
                        childList: true
                    });

                    document.addEventListener('mousemove', function (e) { openrpautil.pushEvent('mousemove', e); }, true);

                    window.onload = function () {
                        if (!DOMUtils.inIframe()) DOMUtils.notifyOffsetToSubFrames();
                        intervalId = setInterval(function () {
                            try {
                                if (isTabFocused) {
                                    if (!DOMUtils.inIframe()) DOMUtils.notifyOffsetToSubFrames();
                                    openrpautil.checkFieldsChange(false);
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }, 3000);
                    };
                    window.onbeforeunload = function (event) {
                        openrpautil.checkFieldsChange(true);
                        if (intervalId) {
                            clearInterval(intervalId);
                        }
                    };

                    document.addEventListener("visibilitychange", function () {
                        if (document.visibilityState === 'visible') {
                            isTabFocused = true;
                        } else {
                            isTabFocused = false;
                        }
                    });

                    if (DOMUtils.iframeDisabled && DOMUtils.inIframe()) return;

                    window.onfocus = function () {
                        isTabFocused = true;
                    };

                    window.onblur = function () {
                        isTabFocused = false;
                        openrpautil.checkFieldsChange(true);
                    };


                    document.addEventListener('click', function (e) {
                        if (e?.target?.id === 'chromium-plugin-modal-layer') {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            return;
                        }
                        openrpautil.addModalLayer();
                        try {
                            openrpautil.pushEvent('click', e);
                        } catch (e) {
                            console.error('click event listener', e);
                        }

                        openrpautil.removeModalLayer();
                    }, true);
                    document.addEventListener('keydown', function (e) {

                        if (e.keyCode === ctrlKey || e.keyCode === cmdKey) ctrlDown = true;

                        if (ctrlDown && (e.keyCode === cKey)) {
                            openrpautil.pushEvent('ctrlc', e);
                            return;
                        }

                        if (ctrlDown && (e.keyCode === vKey)) {
                            openrpautil.pushEvent('ctrlv', e);
                            return;
                        }

                        openrpautil.pushEvent('keydown', e);
                    }, true);
                    document.addEventListener('keypress', function (e) { openrpautil.pushEvent('keyup', e); }, true);
                    document.addEventListener('keyup', function (e) {
                        if (e.keyCode === ctrlKey || e.keyCode === cmdKey) ctrlDown = false;
                        if (e.keyCode === KEYCODE_TAB) {
                            openrpautil.pushEvent('tab', e);
                        }
                        if (e.keyCode === KEYCODE_ENTER) {
                            openrpautil.pushEvent('enter', e);
                        }
                    }, true);
                    document.addEventListener('change', function (e) {
                        handleChange(e);
                    }, true);
                    document.addEventListener('mousedown', function (e) { openrpautil.pushEvent('mousedown', e); }, true);

                    observersOption = {
                        childList: true,
                        subtree: true,
                    };

                    const shadowRootsObserver = new MutationObserver((mutations) => {
                         mutations.forEach((child) => {
                            if (child.target.nodeType === Node.ELEMENT_NODE) {
                                const shadowRoots = getAllShadowRoots(child.target);

                                 shadowRoots.forEach((root) => {
                                    const nestedShadowRootObserver = new MutationObserver((shadowRootMutations) => {
                                        let prevTarget;

                                        shadowRootMutations.forEach((shadowRootMutation) => {
                                            if (prevTarget !== shadowRootMutation.target) {
                                                prevTarget = shadowRootMutation.target;
                                                const nestedShadowRoots = getAllShadowRoots(shadowRootMutation.target);

                                                nestedShadowRoots.forEach((nestedRoot) => {
                                                    nestedRoot.removeEventListener('change', (e) => {
                                                        if (e.isTrusted) handleChange(e);
                                                    }, true);
                                                    
                                                    nestedRoot.addEventListener('change', (e) => {
                                                        if (e.isTrusted) handleChange(e);
                                                    }, true);
                                                })
                                            }
                                        });
                                    })

                                    nestedShadowRootObserver.observe(root, observersOption);
                                })
                            }
                        });
                    });

                    shadowRootsObserver.observe(document, observersOption);

                    openrpautil.getRunningVersion();
                },
                getElementTrackObjectValue: function (ele, inputIsText) {

                    if (ele?.tagName === 'INPUT' && ele?.type?.toUpperCase() === 'PASSWORD') {
                        return 'PASSWORD';
                    }

                    if ((!inputIsText) &&
                        ((ele.tagName === 'INPUT') || (ele.tagName === 'SELECT') || (ele.tagName === 'TEXTAREA')) &&
                        (ele.type)) {
                        return ele.type === 'checkbox' ? ele.checked : ele.value;
                    }

                    if ((inputIsText) &&
                        ((!ele.children) || (ele.children.length === 0)) &&
                        (ele.innerText.length <= 50)) {

                        return ele.innerText;
                    }

                    return null;
                },

                getElementTrackObject: function (ele, actualVasKeys) {
                    const inputTagName = ele.tagName;
                    const inputIsText = (inputTagName === 'A') || (inputTagName === 'DIV') || (inputTagName === 'SPAN');

                    const inputValue = openrpautil.getElementTrackObjectValue(ele, inputIsText);
                    if (inputValue === null) {
                        return null;
                    }

                    let inputCounter = 0;
                    const inputId = ele.id;
                    const inputName = ele.name;
                    const inputType = ele.type;
                    const inputClass = ele.getAttribute('class');
                    const inputXpathFull = (inputIsText) ? null : UTILS.xPath(ele, false);
                    const inputXpath = UTILS.xPath(ele, true);
                    const inputNgModel = ele.getAttribute('ng-model');
                    const uniqueXpath = (inputIsText) ? inputXpath : inputXpathFull;
                    const inputHashKey = UTILS.hash(inputId + inputName + inputType + inputNgModel + uniqueXpath);
                    let inputHashKeyCounter = inputHashKey + '#' + inputCounter;
                    if (actualVasKeys.has(inputHashKeyCounter)) {
                        // manage conflict of ids : use a counter
                        for (let conflictKey of actualVasKeys.keys()) {
                            if (conflictKey.split('#')[0] === inputHashKey.toString()) {// the key has match : find the greater counter
                                let conflictCounter = parseInt(conflictKey.split('#')[1]);
                                inputCounter = conflictCounter > inputCounter ? conflictCounter : inputCounter;
                            }
                        }
                        inputCounter = inputCounter + 1; // increase form gratest value
                        inputHashKeyCounter = inputHashKey + '#' + inputCounter;
                    }
                    actualVasKeys.set(inputHashKeyCounter, inputHashKeyCounter);
                    const inputHashKeyCounterValue = inputHashKey + '#' + inputCounter + '#' + UTILS.hash(inputValue);

                    const isVisible = DOMUtils.isElementVisibleToUser(ele);
                    const inputRectangle = {};
                    try {
                        if (isVisible) openrpautil.applyPhysicalCords(inputRectangle, ele);
                    } catch (e) {
                        console.error(e);
                    }

                    return { hashId: inputHashKeyCounterValue, id: inputId, name: inputName, type: inputType, class: inputClass, xPathFull: inputXpathFull, xPath: inputXpath, value: inputValue, ngModel: inputNgModel, counter: inputCounter, rectangle: inputRectangle };
                },
                extractFields: function () {
                    const actualFields = new Map();
                    const actualFieldKeys = new Map();
                    const inputs = UTILS.getElementsByTagNames(['input', 'select', 'textarea', 'span', 'a', 'div']);
                    for (let index = 0; index < inputs.length; ++index) {
                        const input = inputs[index];
                        if (input.id === 'chromium-plugin-modal-layer') continue; //skip capture of the plugin modal layer
                        const trackObject = openrpautil.getElementTrackObject(input, actualFieldKeys);
                        if (trackObject) {
                            actualFields.set(trackObject.hashId, trackObject);
                        }
                    }
                    console.debug('actualFields', actualFields.values());
                    return actualFields;
                },
                extractDiffFields: function () {
                    if (!window.actualFields) {
                        let actFields = { fieldsMap: new Map(), fieldsMapSize: 0, contextId: -1 };
                        actFields.fieldsMap = openrpautil.extractFields();
                        actFields.fieldsMapSize = actFields.fieldsMap.size;
                        actFields.contextId = new Date().getTime();
                        window.actualFields = actFields;
                        return actFields;
                    }

                    let fields = openrpautil.extractFields();
                    let fieldsCopy = new Map(fields);

                    const actualFieldIterator = window.actualFields.fieldsMap.keys();

                    for (const key of actualFieldIterator) {
                        let curField = window.actualFields.fieldsMap.get(key);
                        let field = fields.get(key);
                        if (openrpautil.fieldEqualityCheck(curField, field)) {
                            fields.delete(key);
                        }
                    }

                    let diffFieldsNumber = fields.size;
                    if (diffFieldsNumber * 100 / window.actualFields.fieldsMapSize > 10) {
                        let actFields = { fieldsMap: new Map(), fieldsMapSize: 0, contextId: -1 };
                        actFields.fieldsMap = fieldsCopy;
                        actFields.fieldsMapSize = fieldsCopy.size;
                        actFields.contextId = new Date().getTime();
                        window.actualFields = actFields;
                        return actFields;
                    }

                    return {
                        fieldsMap: fields,
                        fieldsMapSize: fields.size,
                        contextId: window.actualFields.contextId
                    };
                },
                fieldEqualityCheck: function (a, b) {
                    return a && b
                        && a.id === b.id
                        && (
                            (!a.rectangle && !b.rectangle)
                            || (
                                a.rectangle.x === b.rectangle.x
                                && a.rectangle.y === b.rectangle.y
                                && a.rectangle.width === b.rectangle.width
                                && a.rectangle.height === b.rectangle.height
                                && a.rectangle.uix === b.rectangle.uix
                                && a.rectangle.uiy === b.rectangle.uiy
                                && a.rectangle.uiwidth === b.rectangle.uiwidth
                                && a.rectangle.uiheight === b.rectangle.uiheight
                                && a.rectangle.value === b.rectangle.value
                            )
                        );
                },
                checkFieldsChange: function (sendCurrentPageVals) {
                    if (openrpautil.getRunningVersion() !== 0) return; //Skip in newer version

                    const ts = new Date();
                    //  var t0 = performance.now();

                    // key = hashKey#counter#hashValue
                    const actualVas = new Map();
                    // key = hashKey#counter need for managing fields with same key, so need to increase the counter
                    const actualVasKeys = new Map();
                    let actualVasMatch = 0;
                    const inputs = UTILS.getElementsByTagNames(['input', 'select', 'textarea', 'span', 'a', 'div']);
                    // var inputs = UTILS.getElementsByTagNames(['input', 'select', 'textarea' ]);  
                    for (index = 0; index < inputs.length; ++index) {
                        const trackObject = openrpautil.getElementTrackObject(inputs[index], actualVasKeys);
                        if (trackObject) {
                            actualVas.set(trackObject.hashId, trackObject);
                            if (window.pageVals) {
                                if (window.pageVals.has(trackObject.hashId)) {
                                    actualVasMatch = actualVasMatch + 1;
                                }
                                // else { console.log('not match : ' + '- ' + trackObject.hashId + '  object   : ' + trackObject.inputId + trackObject.name + trackObject.type + trackObject.xPath + trackObject.value );        }
                            }
                        }

                    }

                    const minDelta = (window.pageVals) ? window.pageVals.size * 0.2 : -1; // minimum number of values changed to detect a major event  is 20%
                    //console.error(window.location, window.name);
                    if ((sendCurrentPageVals) || // force for window onblur or onunload
                        (minDelta === -1) || // first run
                        (Math.abs(window.pageVals.size - actualVas.size) >= minDelta) ||  // major change of number  of fields 
                        (actualVas.size - actualVasMatch >= minDelta)) { // major change of values  of fields 
                        if (sendCurrentPageVals && (actualVas) && (actualVas.size > 0)) {
                            openrpautil.raiseFieldsChangeEvent(actualVas, ts/*window.pageValsTs*/); // send the field of current page (for example on blur of page)
                            window.pageValsTs = ts;
                            window.pageVals = null; // reset the page attributes
                            window.pageVals = actualVas;
                        } else if ((window.pageVals) && (window.pageVals.size > 0)) {
                            openrpautil.raiseFieldsChangeEvent(actualVas, window.pageValsTs);  // send the previus field (for example a major event has already done)
                            window.pageValsTs = ts;
                            window.pageVals = null; // reset the page attributes
                            window.pageVals = actualVas;
                        } else if (minDelta === -1) {
                            openrpautil.raiseFieldsChangeEvent(actualVas, ts/*window.pageValsTs*/);  // send the previus field (for example a major event has already done)
                            window.pageValsTs = ts;
                            window.pageVals = null; // reset the page attributes
                            window.pageVals = actualVas;
                        }
                    }

                    //window.pageVals = null; // reset the page attributes
                    //window.pageVals = actualVas;
                    //console.log("Save actual values: " + new Date().toISOString())
                    //  var t1 = performance.now();
                    //  console.log("Call to checkFieldsChange took " + (t1 - t0) + " milliseconds, at time : " + new Date().toISOString()  )

                },
                raiseFieldsChangeEvent(fields, ts) {
                    if (!ts) {
                        ts = new Date();
                        console.debug("raiseFieldsChangeEvent init default ts");
                    }

                    if (!fields) return;
                    try {
                        const arrOfFields = Array.from(fields.values()).map(function (obj) {
                            let result = {
                                id: obj.id,
                                name: obj.name,
                                "class": obj.class,
                                type: obj.type,
                                xPathFull: obj.xPathFull,
                                xPath: obj.xPath,
                                value: obj.value
                            };

                            if (/*obj.value && */obj.rectangle && obj.rectangle.height > 0 && obj.rectangle.width > 0) {
                                result.rectangle = obj.rectangle;
                            }
                            return result;
                        });

                        console.log('dumprelevantdata: ' + arrOfFields.length + ' ts: ' + ts.toISOString());

                        host.runtime.sendMessage({ functionName: "dumprelevantdata", referenceTimeStamp: ts.toISOString(), result: JSON.stringify(arrOfFields) });

                    } catch (e) {
                        console.error(e);
                    }
                },
                findform: function (element) {
                    try {
                        var form = null;
                        var ele = element;
                        while (ele && !form) {
                            var name = ele.localName;
                            if (!name) {
                                ele = ele.parentNode;
                                continue;
                            }
                            name = name.toLowerCase();
                            if (name === "form") form = ele;
                            ele = ele.parentNode;
                        }
                        return form;
                    } catch (e) {
                        console.error(e);
                        return null;
                    }
                },
                applyPhysicalCords: function (message, ele) {
                    const clientRect = ele.getBoundingClientRect();
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    const scrollLeft = (((t = document.documentElement) || (t = document.body.parentNode)) && typeof t.scrollLeft === 'number' ? t : document.body).scrollLeft;
                    const eleWidth = ele.offsetWidth || clientRect.width;
                    const eleHeight = ele.offsetHeight || clientRect.height;

                    message.x = Math.floor(clientRect.left);
                    message.y = Math.floor(clientRect.top);
                    message.width = Math.floor(eleWidth);
                    message.height = Math.floor(eleHeight);
                    message.uiwidth = Math.round(eleWidth * devicePixelRatio);
                    message.uiheight = Math.round(eleHeight * devicePixelRatio);
                    if (window.self === window.top) {
                        message.uix = Math.round((clientRect.left - scrollLeft) * devicePixelRatio);
                        message.uiy = Math.round((clientRect.top * devicePixelRatio) + (window.outerHeight - (window.innerHeight * devicePixelRatio)));
                    } else {
                        message.uix = Math.round(clientRect.left * devicePixelRatio);
                        message.uiy = Math.round(clientRect.top * devicePixelRatio);
                    }
                    if (DOMUtils.inIframe() === false) {
                        let isAtMaxWidth = screen.availWidth - window.innerWidth === 0;
                        if (isAtMaxWidth) {
                            let isFirefox = typeof InstallTrigger !== 'undefined';
                            if (isFirefox) {
                                message.uix += 8;
                                message.uiy -= 7;
                            } else {
                                message.uix += 8;
                                message.uiy += 8;
                            }
                        } else {
                            message.uix += 7;
                            message.uiy -= 7;
                        }
                    }
                },
                // https://stackoverflow.com/questions/53056796/getboundingclientrect-from-within-iframe
                currentFrameAbsolutePosition: function () {
                    return DOMUtils.computeFrameOffset(window);
                },
                getOffset: function (el) {
                    let _x = 0;
                    let _y = 0;
                    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
                        _x += el.offsetLeft - el.scrollLeft;
                        _y += el.offsetTop - el.scrollTop;
                        el = el.offsetParent;
                    }
                    return { top: _y, left: _x };
                },
                pushEvent: function (action, event) {
                    let frame = -1;
                    if (window.frameElement) frame = window.frameElement.id;

                    if (action === 'keydown') {
                        chrome.runtime.sendMessage({ functionName: action, key: String.fromCharCode(event.which) });
                    }
                    else if (action === 'keyup') {
                        chrome.runtime.sendMessage({ functionName: action, key: String.fromCharCode(event.which) });
                    }
                    else {
                        // https://www.jeffersonscher.com/res/resolution.php
                        // https://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
                        let message = { functionName: action, frame: frame, parents: 0, xpaths: [] };
                        let targetElement = null;
                        targetElement = event.target || event.srcElement;
                        if (targetElement == null) {
                            console.log('targetElement == null');
                            return;
                        }
                        if (action === 'mousemove') {
                            last_mousemove = targetElement;
                        }
                        try {
                            openrpautil.applyPhysicalCords(message, targetElement);
                        } catch (e) {
                            console.error(e);
                        }

                        if (DOMUtils.inIframe()) {
                            let currentFramePosition = openrpautil.currentFrameAbsolutePosition();
                            message.uix += currentFramePosition.left;
                            message.uiy += currentFramePosition.top;

                            message.x += currentFramePosition.left;
                            message.y += currentFramePosition.top;
                        }

                        if (openrpautil.parent != null) {
                            message.parents = openrpautil.parent.parents + 1;
                            message.xpaths = openrpautil.parent.xpaths.slice(0);

                            if (!DOMUtils.inIframe()) {
                                message.uix += openrpautil.parent.uix;
                                message.uiy += openrpautil.parent.uiy;
                            }
                        }

                        message.cssPath = UTILS.cssPath(targetElement, false);
                        message.xPath = UTILS.xPath(targetElement, true);
                        message.zn_id = openrpautil.getuniqueid(targetElement);
                        message.c = targetElement.childNodes.length;

                        message.result = openrpautil.mapDOM(targetElement, true);

                        if (openrpautil.getRunningVersion() > 0 && (action === 'click' || action === 'tab' || action === 'ctrlc' || action === 'ctrlv')) {
                            let fields = openrpautil.extractDiffFields();
                            if (fields && fields.fieldsMap) {
                                let msgFields = {
                                    list: JSON.stringify(Array.from(fields.fieldsMap, ([name, value]) => (value))),
                                    length: fields.fieldsMapSize,
                                    contextId: fields.contextId
                                };
                                message.fields = msgFields;
                                console.debug('openrpautil.extractDiffFields()', fields.contextId, fields);
                            }
                        }

                        //if (targetElement.tagName == "IFRAME" || targetElement.tagName == "FRAME") {
                        message.xpaths.push(message.xPath);
                        //if (document.openrpadebug)
                        // console.log({ uix: message.uix, uiy: message.uiy, parent: message.parents })
                        //console.log({ x: message.x, y: message.y, uix: message.uix, uiy: message.uiy, parent: message.parents })

                        // console.log(targetElement.tagName + ' ' + message.xPath);
                        if (targetElement.contentWindow) {
                            const iframeWin = targetElement.contentWindow;
                            iframeWin.postMessage(message, '*');
                            console.log('targetElement.tagName == iframe or frame');
                            return;
                        }

                        chrome.runtime.sendMessage(message);
                    }
                },
                getuniqueid: function (element) {
                    if (element === null || element === undefined) return null;
                    if (element.attributes === null || element.attributes === undefined) return null;
                    for (let r = 0; r < element.attributes.length; r++) {
                        const name = element.attributes[r].nodeName;
                        if (name === 'zn_id') return element.attributes[r].nodeValue;
                    }
                    if (element === null || element === undefined) return null;
                    if (element.attributes === null || element.attributes === undefined) return null;
                    ++cachecount;
                    //                    element.setAttribute('zn_id', cachecount);
                    return cachecount;
                },
                executescript: function (message) {
                    try {
                        console.debug('executescript', message);
                        if (document.openrpadebug) console.log('script', message.script);
                        message.result = eval(message.script);
                        if (document.openrpadebug) console.log('result', message.result);
                    } catch (e) {
                        console.error(e);
                        message.error = e;
                    }
                    delete message.script;
                    let test = JSON.parse(JSON.stringify(message));
                    if (document.openrpadebug) console.log(test);
                    return test;
                },
                fullPath: function (el) {
                    let names = [];
                    while (el.parentNode) {
                        if (el.id) {
                            names.unshift('#' + el.id);
                            break;
                        } else {
                            if (el === el.ownerDocument.documentElement) names.unshift(el.tagName);
                            else {
                                for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
                                names.unshift(el.tagName + ":nth-child(" + c + ")");
                            }
                            el = el.parentNode;
                        }
                    }
                    return names.join(" > ");
                },
                toJSON: function (node, maxiden, ident) {
                    if (ident === null || ident === undefined) ident = 0;
                    if (maxiden === null || maxiden === undefined) ident = 1;

                    node = node || this;
                    let obj = {
                        nodeType: node.nodeType
                    };
                    if (node.tagName) {
                        obj.tagName = node.tagName.toLowerCase();
                    } else
                        if (node.nodeName) {
                            obj.nodeName = node.nodeName;
                        }
                    if (node.nodeValue) {
                        obj.nodeValue = node.nodeValue;
                    }
                    let attrs = node.attributes;
                    if (attrs) {
                        const length = attrs.length;
                        const arr = obj.attributes = new Array(length);
                        for (let i = 0; i < length; i++) {
                            let attr = attrs[i];
                            arr[i] = [attr.nodeName, attr.nodeValue];
                        }
                    }
                    let childNodes = node.childNodes;
                    if (childNodes && ident < maxiden) {
                        const length = childNodes.length;
                        const arr = obj.childNodes = new Array(length);
                        for (let i = 0; i < length; i++) {
                            arr[i] = openrpautil.toJSON(childNodes[i], maxiden, ident + 1);
                        }
                    }
                    return obj;
                },
                toDOM: function (obj) {
                    if (typeof obj === 'string') {
                        obj = JSON.parse(obj);
                    }
                    let node, nodeType = obj.nodeType;
                    switch (nodeType) {
                        case 1: //ELEMENT_NODE
                            node = document.createElement(obj.tagName);
                            const attributes = obj.attributes || [];
                            for (let i = 0, len = attributes.length; i < len; i++) {
                                const attr = attributes[i];
                                node.setAttribute(attr[0], attr[1]);
                            }
                            break;
                        case 3: //TEXT_NODE
                            node = document.createTextNode(obj.nodeValue);
                            break;
                        case 8: //COMMENT_NODE
                            node = document.createComment(obj.nodeValue);
                            break;
                        case 9: //DOCUMENT_NODE
                            node = document.implementation.createDocument();
                            break;
                        case 10: //DOCUMENT_TYPE_NODE
                            node = document.implementation.createDocumentType(obj.nodeName);
                            break;
                        case 11: //DOCUMENT_FRAGMENT_NODE
                            node = document.createDocumentFragment();
                            break;
                        default:
                            return node;
                    }
                    if (nodeType === 1 || nodeType === 11) {
                        let childNodes = obj.childNodes || [];
                        for (i = 0, len = childNodes.length; i < len; i++) {
                            node.appendChild(openrpautil.toDOM(childNodes[i]));
                        }
                    }
                    return node;
                },
                mapDOM: function (element, json, mapdom, innerhtml) {
                    let maxiden = 40;
                    if (mapdom !== true) maxiden = 1;
                    if (maxiden === null || maxiden === undefined) maxiden = 20;
                    let treeObject = {};
                    // If string convert to document Node
                    if (typeof element === "string") {
                        if (window.DOMParser) {
                            parser = new DOMParser();
                            docNode = parser.parseFromString(element, "text/xml");
                        } else { // Microsoft strikes again
                            docNode = new ActiveXObject("Microsoft.XMLDOM");
                            docNode.async = false;
                            docNode.loadXML(element);
                        }
                        element = docNode.firstChild;
                    }
                    //Recursively loop through DOM elements and assign properties to object
                    function treeHTML(element, object, maxiden, ident) {
                        if (ident === null || ident === undefined) ident = 0;
                        if (maxiden === null || maxiden === undefined) maxiden = 1;
                        openrpautil.getuniqueid(element);
                        object["tagName"] = element.tagName;
                        if (ident === 0) {
                            object["xPath"] = UTILS.xPath(element, true);
                            object["xPathFull"] = ((element.tagName === 'A') || (element.tagName === 'DIV') || (element.tagName === 'SPAN')) ? null : UTILS.xPath(element, false);
                            object["cssPath"] = UTILS.cssPath(element, false);
                            if (object["tagName"] !== 'STYLE' && object["tagName"] !== 'SCRIPT' && object["tagName"] !== 'HEAD' && object["tagName"] !== 'HTML') {
                                if (element.innerText !== undefined && element.innerText !== null && element.innerText !== '') {
                                    object["innerText"] = element.innerText;
                                }
                            }
                        }
                        let nodeList = element.childNodes;
                        if (nodeList) {
                            if (nodeList.length) {
                                object["content"] = [];
                                for (const element of nodeList) {
                                    if (element.nodeType === 3) {
                                        if (mapdom !== true) {
                                            if (object["tagName"] !== 'STYLE' && object["tagName"] !== 'SCRIPT' && object["tagName"] !== 'HEAD') {
                                                object["content"].push(element.nodeValue);
                                            }
                                        }
                                    } else {
                                        if (ident < maxiden) {
                                            object["content"].push({});
                                            treeHTML(element, object["content"][object["content"].length - 1], maxiden, ident + 1);
                                        }
                                    }
                                }
                            }
                        }
                        if (element.attributes) {
                            if (element.attributes.length) {
                                let wasDisabled = false;
                                // To read values of disabled objects, we need to undisable them
                                //if (element.disabled === true) {
                                //    console.log('removing disabled!!!!');
                                //    wasDisabled = true;
                                //    //element.disabled == false;
                                //    element.removeAttribute("disabled");
                                //}
                                let attributecount = 0;
                                /*
                                if (element.attributes["zn_id"] == undefined || element.attributes["zn_id"] == null) {
                                    let zn_id = openrpautil.getuniqueid(element);
                                }
                                */
                                //-->                                ["zn_id"] = element.attributes["zn_id"].nodeValue;
                                for (let r = 0; r < element.attributes.length; r++) {
                                    let name = element.attributes[r].nodeName;
                                    let value = element.attributes[r].nodeValue;
                                    // value, innertext
                                    if (ident === 0) {
                                        if (mapdom !== true || name.toLowerCase() === 'zn_id') {
                                            object[name] = value;
                                            ++attributecount;
                                        }
                                        //if (['zn_id', 'id', 'classname', 'name', 'tagname', 'href', 'src', 'alt', 'clientrects'].includes(name.toLowerCase())) {
                                        //    //object["attributes"][name] = value;
                                        //    object[name] = value;
                                        //    ++attributecount;
                                        //}
                                    }
                                    else if (ident > 0 && mapdom === true) {
                                        if (name.toLowerCase() === 'zn_id') {
                                            //object["attributes"][name] = value;
                                            object[name] = value;
                                            ++attributecount;
                                        }
                                    }
                                }
                                //if (attributecount === 0) delete object["attributes"];
                                if (wasDisabled === true) {
                                    if (ident === 0) {
                                        //element.disabled == true;
                                        element.setAttribute("disabled", "true");
                                    }
                                }
                            }
                        }
                    }
                    treeHTML(element, treeObject, maxiden);
                    treeObject["value"] = element.value;
                    treeObject["isvisible"] = openrpautil.isVisible(element);
                    treeObject["display"] = openrpautil.display(element);
                    treeObject["isvisibleonscreen"] = openrpautil.isVisibleOnScreen(element);
                    treeObject["disabled"] = element.disabled;
                    treeObject["innerText"] = element.innerText || '';
                    treeObject["additions"] = openrpautil.getAdditions(element);

                    //textContent
                    if (innerhtml) {
                        treeObject["innerhtml"] = element.innerHTML;
                        if (element.textContent) {
                            treeObject["textcontent"] = element.textContent;
                        }
                    }
                    if (element.tagName == "INPUT" && element.getAttribute("type") == "checkbox") {
                        treeObject["checked"] = element.checked;
                    }
                    if (element.tagName && element.tagName.toLowerCase() == "options") {
                        treeObject["selected"] = element.selected;
                    }
                    if (element.tagName && element.tagName.toLowerCase() == "select") {
                        let selectedvalues = [];
                        for (i = 0; i < element.options.length; i++) {
                            if (element.options[i].selected) {
                                selectedvalues.push(element.options[i].value);
                                treeObject["text"] = element.options[i].text;
                            }
                        }
                        treeObject["values"] = selectedvalues;
                    }

                    //updateelementtext
                    if (treeObject["disabled"] === null || treeObject["disabled"] === undefined) treeObject["disabled"] = false;
                    return json ? JSON.stringify(treeObject) : treeObject;
                },
                getAdditions: function (elm) {
                    let additions = {};

                    try {
                        let cells = getTableRowCellsFrom(elm);

                        if (cells.length > 0) {
                            additions["tableRowCells"] = cells;
                        }

                        return additions;
                    }
                    catch (e) {
                        //window.console.error(e);
                        return {};
                    }

                    function getTableRowCellsFrom(element) {
                        let data = [];
                        while (element && element.nodeName !== "TR") {
                            element = element.parentNode;
                        }
                        if (element) {
                            let td = element.getElementsByTagName("td");
                            for (const element of td) {
                                data.push(element.innerText);
                            }
                        }
                        return data;
                    }
                },
                isVisibleOnScreen: function (elm) {
                    let rect = elm.getBoundingClientRect();
                    let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
                },
                isVisible: function (elm) {
                    return elm.offsetWidth > 0 && elm.offsetHeight > 0;
                },
                display: function (elm) {
                    return window.getComputedStyle(elm, null).getPropertyValue('display');
                },
                getFrameName: function (frame) {
                    let frames = parent.frames,
                        l = frames.length,
                        name = null;
                    for (let x = 0; x < l; x++) {
                        if (frames[x] === frame) {
                            name = frames[x].name;
                        }
                    }
                    return name;
                },
                screenInfo: function () {
                    return {
                        screen: {
                            availTop: window.screen.availTop,
                            availLeft: window.screen.availLeft,
                            availHeight: window.screen.availHeight,
                            availWidth: window.screen.availWidth,
                            colorDepth: window.screen.colorDepth,
                            height: window.screen.height,
                            left: window.screen.left,
                            orientation: window.screen.orientation,
                            pixelDepth: window.screen.pixelDepth,
                            top: window.screen.top,
                            width: window.screen.width
                        },
                        screenX: window.screenX,
                        screenY: window.screenY,
                        screenLeft: window.screenLeft,
                        screenTop: window.screenTop
                    };
                },
                getXPath(el) {
                    let nodeElem = el;
                    if (nodeElem.id && this.options.shortid) {
                        return `//*[@id="${nodeElem.id}"]`;
                    }
                    const parts = [];
                    while (nodeElem && nodeElem.nodeType === Node.ELEMENT_NODE) {
                        let nbOfPreviousSiblings = 0;
                        let hasNextSiblings = false;
                        let sibling = nodeElem.previousSibling;
                        while (sibling) {
                            if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE && sibling.nodeName === nodeElem.nodeName) {
                                nbOfPreviousSiblings++;
                            }
                            sibling = sibling.previousSibling;
                        }
                        sibling = nodeElem.nextSibling;
                        while (sibling) {
                            if (sibling.nodeName === nodeElem.nodeName) {
                                hasNextSiblings = true;
                                break;
                            }
                            sibling = sibling.nextSibling;
                        }
                        const prefix = nodeElem.prefix ? nodeElem.prefix + ':' : '';
                        const nth = nbOfPreviousSiblings || hasNextSiblings ? `[${nbOfPreviousSiblings + 1}]` : '';
                        parts.push(prefix + nodeElem.localName + nth);
                        nodeElem = nodeElem.parentNode;
                    }
                    return parts.length ? '/' + parts.reverse().join('/') : '';
                },
                addModalLayer: function () {
                    let modalLayer = document.getElementById('chromium-plugin-modal-layer');
                    if (modalLayer) {
                        modalLayer.style.display = 'visible';
                    } else {
                        let target = document.querySelector("body");

                        modalLayer = document.createElement('div');
                        modalLayer.id = 'chromium-plugin-modal-layer';
                        modalLayer.style.position = 'fixed';
                        modalLayer.style.top = 0;
                        modalLayer.style.bottom = 0;
                        modalLayer.style.left = 0;
                        modalLayer.style.right = 0;
                        modalLayer.style.zIndex = '99999';

                        modalLayer.onclick = () => { console.info('block onclick'); };
                        modalLayer.onmouseout = () => { console.info('block onmouseout'); };
                        modalLayer.onmouseover = () => { console.info('block onmouseover'); };
                        modalLayer.onwheel = () => { console.info('block onwheel'); };

                        target.appendChild(modalLayer);
                    }
                },
                removeModalLayer: function () {
                    let modalLayer = document.getElementById('chromium-plugin-modal-layer');
                    if (modalLayer) {
                        modalLayer.style.display = 'none';
                        modalLayer.parentNode.removeChild(modalLayer);
                    }
                },
                setRunningVersion: function (newV) {
                    if (newV !== null && !isNaN(newV) && newV >= 0) {
                        this.runningVersion = newV;
                        console.debug("runningVersion = " + newV);
                    }
                },
                getRunningVersion: function () {
                    if (this.runningVersion && this.runningVersion >= 0) {
                        return this.runningVersion;
                    } else {
                        chrome.runtime.sendMessage(null, { functionName: "refreshRunningVersion" }, null, (newV) => { this.setRunningVersion(newV); });
                        return 0;
                    }
                },

            };
            document.openrpautil = openrpautil;
            openrpautil.init();

            // https://chromium.googlesource.com/chromium/blink/+/master/Source/devtools/front_end/components/DOMPresentationUtils.js
            // https://gist.github.com/asfaltboy/8aea7435b888164e8563
            /*
             * Copyright (C) 2015 Pavel Savshenko
             * Copyright (C) 2011 Google Inc.  All rights reserved.
             * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
             * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
             * Copyright (C) 2009 Joseph Pecoraro
             *
             * Redistribution and use in source and binary forms, with or without
             * modification, are permitted provided that the following conditions
             * are met:
             *
             * 1.  Redistributions of source code must retain the above copyright
             *     notice, this list of conditions and the following disclaimer.
             * 2.  Redistributions in binary form must reproduce the above copyright
             *     notice, this list of conditions and the following disclaimer in the
             *     documentation and/or other materials provided with the distribution.
             * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
             *     its contributors may be used to endorse or promote products derived
             *     from this software without specific prior written permission.
             *
             * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
             * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
             * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
             * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
             * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
             * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
             * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
             * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
             * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
             * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
             */

            var UTILS = {};
            UTILS.xPath = function (node, optimized) {
                if (node.nodeType === Node.DOCUMENT_NODE)
                    return "/";
                let steps = [];
                let contextNode = node;
                while (contextNode) {
                    let step = UTILS._xPathValue(contextNode, optimized);
                    if (!step)
                        break; // Error - bail out early.
                    steps.push(step);
                    if (step.optimized)
                        break;
                    contextNode = contextNode.parentNode;
                }
                steps.reverse();
                return (steps.length && steps[0].optimized ? "" : "/") + steps.join("/");
            };
            UTILS._xPathValue = function (node, optimized) {
                let ownValue;
                let ownIndex = UTILS._xPathIndex(node);
                if (ownIndex === -1)
                    return null; // Error.
                switch (node.nodeType) {
                    case Node.ELEMENT_NODE:
                        ownValue = node.localName;
                        if (optimized) {

                            for (const element of document.openrpauniquexpathids) {
                                let id = element.toLowerCase();
                                if (node.getAttribute(id))
                                    return new UTILS.DOMNodePathStep("//" + ownValue + "[@" + id + "=\"" + node.getAttribute(id) + "\"]", true);
                                id = id.toUpperCase();
                                if (node.getAttribute(id))
                                    return new UTILS.DOMNodePathStep("//" + ownValue + "[@" + id + "=\"" + node.getAttribute(id) + "\"]", true);
                            }
                        }
                        if (optimized && node.getAttribute("id"))
                            return new UTILS.DOMNodePathStep("//" + ownValue + "[@id=\"" + node.getAttribute("id") + "\"]", true);
                        break;
                    case Node.ATTRIBUTE_NODE:
                        ownValue = "@" + node.nodename;
                        break;
                    case Node.TEXT_NODE:
                    case Node.CDATA_SECTION_NODE:
                        ownValue = "text()";
                        break;
                    case Node.PROCESSING_INSTRUCTION_NODE:
                        ownValue = "processing-instruction()";
                        break;
                    case Node.COMMENT_NODE:
                        ownValue = "comment()";
                        break;
                    case Node.DOCUMENT_NODE:
                        ownValue = "";
                        break;
                    default:
                        ownValue = "";
                        break;
                }
                if (ownIndex > 0)
                    ownValue += "[" + ownIndex + "]";
                return new UTILS.DOMNodePathStep(ownValue, node.nodeType === Node.DOCUMENT_NODE);
            };


            UTILS._xPathIndex = function (node) {
                // Returns -1 in case of error, 0 if no siblings matching the same expression, <XPath index among the same expression-matching sibling nodes> otherwise.
                function areNodesSimilar(left, right) {
                    if (left === right)
                        return true;
                    if (left.nodeType === Node.ELEMENT_NODE && right.nodeType === Node.ELEMENT_NODE)
                        return left.localName === right.localName;
                    if (left.nodeType === right.nodeType)
                        return true;
                    // XPath treats CDATA as text nodes.
                    let leftType = left.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : left.nodeType;
                    let rightType = right.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : right.nodeType;
                    return leftType === rightType;
                }
                let siblings = node.parentNode ? node.parentNode.children : null;
                if (!siblings)
                    return 0; // Root node - no siblings.
                let hasSameNamedElements;
                for (const element of siblings) {
                    if (areNodesSimilar(node, element) && element !== node) {
                        hasSameNamedElements = true;
                        break;
                    }
                }
                if (!hasSameNamedElements)
                    return 0;
                let ownIndex = 1; // XPath indices start with 1.
                for (const element of siblings) {
                    if (areNodesSimilar(node, element)) {
                        if (element === node)
                            return ownIndex;
                        ++ownIndex;
                    }
                }
                return -1; // An error occurred: |node| not found in parent's children.
            };

            UTILS.cssPath = function (node, optimized) {
                if (node.nodeType !== Node.ELEMENT_NODE)
                    return "";
                let steps = [];
                let contextNode = node;
                while (contextNode) {
                    let step = UTILS._cssPathStep(contextNode, !!optimized, contextNode === node);
                    if (!step)
                        break; // Error - bail out early.
                    steps.push(step);
                    if (step.optimized)
                        break;
                    contextNode = contextNode.parentNode;
                }
                steps.reverse();
                return steps.join(" > ");
            };
            UTILS._cssPathStep = function (node, optimized, isTargetNode) {
                if (node.nodeType !== Node.ELEMENT_NODE)
                    return null;

                let id = node.getAttribute("id");
                if (optimized) {
                    if (id)
                        return new UTILS.DOMNodePathStep(idSelector(id), true);
                    let nodeNameLower = node.nodeName.toLowerCase();
                    if (nodeNameLower === "body" || nodeNameLower === "head" || nodeNameLower === "html")
                        return new UTILS.DOMNodePathStep(node.nodeName.toLowerCase(), true);
                }
                let nodeName = node.nodeName.toLowerCase();

                if (id)
                    return new UTILS.DOMNodePathStep(nodeName.toLowerCase() + idSelector(id), true);
                let parent = node.parentNode;
                if (!parent || parent.nodeType === Node.DOCUMENT_NODE)
                    return new UTILS.DOMNodePathStep(nodeName.toLowerCase(), true);
                function prefixedElementClassNames(node) {
                    let classAttribute = node.getAttribute("class");
                    if (!classAttribute)
                        return [];

                    return classAttribute.split(/\s+/g).filter(Boolean).map(function (name) {
                        // The prefix is required to store "__proto__" in a object-based map.
                        return "$" + name;
                    });
                }
                function idSelector(id) {
                    return "#" + escapeIdentifierIfNeeded(id);
                }
                function escapeIdentifierIfNeeded(ident) {
                    if (isCSSIdentifier(ident))
                        return ident;
                    let shouldEscapeFirst = /^(?:[0-9]|-[0-9-]?)/.test(ident);
                    let lastIndex = ident.length - 1;
                    return ident.replace(/./g, function (c, i) {
                        return shouldEscapeFirst && i === 0 || !isCSSIdentChar(c) ? escapeAsciiChar(c, i === lastIndex) : c;
                    });
                }
                function escapeAsciiChar(c, isLast) {
                    return "\\" + toHexByte(c) + (isLast ? "" : " ");
                }
                function toHexByte(c) {
                    let hexByte = c.charCodeAt(0).toString(16);
                    if (hexByte.length === 1)
                        hexByte = "0" + hexByte;
                    return hexByte;
                }
                function isCSSIdentChar(c) {
                    if (/[a-zA-Z0-9_-]/.test(c))
                        return true;
                    return c.charCodeAt(0) >= 0xA0;
                }
                function isCSSIdentifier(value) {
                    return /^-?[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value);
                }
                let prefixedOwnClassNamesArray = prefixedElementClassNames(node);
                let needsClassNames = false;
                let needsNthChild = false;
                let ownIndex = -1;
                let siblings = parent.children;
                for (let i = 0; (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
                    let sibling = siblings[i];
                    if (sibling === node) {
                        ownIndex = i;
                        continue;
                    }
                    if (needsNthChild)
                        continue;
                    if (sibling.nodeName.toLowerCase() !== nodeName.toLowerCase())
                        continue;

                    needsClassNames = true;
                    let ownClassNames = prefixedOwnClassNamesArray;
                    let ownClassNameCount = 0;
                    for (let name in ownClassNames)
                        ++ownClassNameCount;
                    if (ownClassNameCount === 0) {
                        needsNthChild = true;
                        continue;
                    }
                    let siblingClassNamesArray = prefixedElementClassNames(sibling);
                    for (const element of siblingClassNamesArray) {
                        let siblingClass = element;
                        if (ownClassNames.indexOf(siblingClass))
                            continue;
                        delete ownClassNames[siblingClass];
                        if (!--ownClassNameCount) {
                            needsNthChild = true;
                            break;
                        }
                    }
                }

                let result = nodeName.toLowerCase();
                if (isTargetNode && nodeName.toLowerCase() === "input" && node.getAttribute("type") && !node.getAttribute("id") && !node.getAttribute("class"))
                    result += "[type=\"" + node.getAttribute("type") + "\"]";
                if (needsNthChild) {
                    result += ":nth-child(" + (ownIndex + 1) + ")";
                } else if (needsClassNames) {
                    for (let prefixedName in prefixedOwnClassNamesArray)
                        // for (var prefixedName in prefixedOwnClassNamesArray.keySet())
                        result += "." + escapeIdentifierIfNeeded(prefixedOwnClassNamesArray[prefixedName].substr(1));
                }

                return new UTILS.DOMNodePathStep(result, false);
            };
            UTILS.DOMNodePathStep = function (value, optimized) {
                this.value = value;
                this.optimized = optimized || false;
            };
            UTILS.DOMNodePathStep.prototype = {
                toString: function () {
                    return this.value;
                }
            };

            UTILS.hash = function (str) {

                let hash = 0, i, chr;
                for (i = 0; i < str.length; i++) {
                    chr = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + chr;
                    hash |= 0; // Convert to 32bit integer
                }
                return hash;

            }


            UTILS.getElementsByTagNames = function (tags) {
                let elements = [];

                for (let i = 0, n = tags.length; i < n; i++) {
                    // Concatenate the array created from a HTMLCollection object
                    elements = elements.concat(Array.prototype.slice.call(document.getElementsByTagName(tags[i])));
                }

                return elements;
            };



        }
    }
}

//
// THIS FILE IS AUTOMATICALLY GENERATED! DO NOT EDIT BY HAND!
//
; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? module.exports = factory()
        : typeof define === 'function' && define.amd
            ? define(factory) :
            // cf. https://github.com/dankogai/js-base64/issues/119
            (function () {
                // existing version for noConflict()
                const _Base64 = global.Base64;
                const gBase64 = factory();
                gBase64.noConflict = () => {
                    global.Base64 = _Base64;
                    return gBase64;
                };
                if (global.Meteor) { // Meteor.js
                    Base64 = gBase64;
                }
                global.Base64 = gBase64;
            })();
}((typeof self !== 'undefined' ? self
    : typeof window !== 'undefined' ? window
        : typeof global !== 'undefined' ? global
            : this
), function () {
    'use strict';

    /**
     *  base64.ts
     *
     *  Licensed under the BSD 3-Clause License.
     *    http://opensource.org/licenses/BSD-3-Clause
     *
     *  References:
     *    http://en.wikipedia.org/wiki/Base64
     *
     * @author Dan Kogai (https://github.com/dankogai)
     */
    const version = '3.4.5';
    /**
     * @deprecated use lowercase `version`.
     */
    const VERSION = version;
    const _hasatob = typeof atob === 'function';
    const _hasbtoa = typeof btoa === 'function';
    const _hasBuffer = typeof Buffer === 'function';
    const b64ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const b64chs = [...b64ch];
    const b64tab = ((a) => {
        let tab = {};
        a.forEach((c, i) => tab[c] = i);
        return tab;
    })(b64chs);
    const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
    const _fromCC = String.fromCharCode.bind(String);
    const _U8Afrom = typeof Uint8Array.from === 'function'
        ? Uint8Array.from.bind(Uint8Array)
        : (it, fn = (x) => x) => new Uint8Array(Array.prototype.slice.call(it, 0).map(fn));
    const _mkUriSafe = (src) => src
        .replace(/[+\/]/g, (m0) => m0 == '+' ? '-' : '_')
        .replace(/=+$/m, '');
    const _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, '');
    /**
     * polyfill version of `btoa`
     */
    const btoaPolyfill = (bin) => {
        // console.log('polyfilled');
        let u32, c0, c1, c2, asc = '';
        const pad = bin.length % 3;
        for (let i = 0; i < bin.length;) {
            if ((c0 = bin.charCodeAt(i++)) > 255 ||
                (c1 = bin.charCodeAt(i++)) > 255 ||
                (c2 = bin.charCodeAt(i++)) > 255)
                throw new TypeError('invalid character found');
            u32 = (c0 << 16) | (c1 << 8) | c2;
            asc += b64chs[u32 >> 18 & 63]
                + b64chs[u32 >> 12 & 63]
                + b64chs[u32 >> 6 & 63]
                + b64chs[u32 & 63];
        }
        return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
    };
    /**
     * does what `window.btoa` of web browsers do.
     * @param {String} bin binary string
     * @returns {string} Base64-encoded string
     */
    const _btoa = _hasbtoa ? (bin) => btoa(bin)
        : _hasBuffer ? (bin) => Buffer.from(bin, 'binary').toString('base64')
            : btoaPolyfill;
    const _fromUint8Array = _hasBuffer
        ? (u8a) => Buffer.from(u8a).toString('base64')
        : (u8a) => {
            // cf. https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string/12713326#12713326
            const maxargs = 0x1000;
            let strs = [];
            for (let i = 0, l = u8a.length; i < l; i += maxargs) {
                strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
            }
            return _btoa(strs.join(''));
        };
    /**
     * converts a Uint8Array to a Base64 string.
     * @param {boolean} [urlsafe] URL-and-filename-safe a la RFC4648 §5
     * @returns {string} Base64 string
     */
    const fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
    /**
     * @deprecated should have been internal use only.
     * @param {string} src UTF-8 string
     * @returns {string} UTF-16 string
     */
    const utob = (src) => unescape(encodeURIComponent(src));
    //
    const _encode = _hasBuffer
        ? (s) => Buffer.from(s, 'utf8').toString('base64')
        : (s) => _btoa(utob(s));
    /**
     * converts a UTF-8-encoded string to a Base64 string.
     * @param {boolean} [urlsafe] if `true` make the result URL-safe
     * @returns {string} Base64 string
     */
    const encode = (src, urlsafe = false) => urlsafe
        ? _mkUriSafe(_encode(src))
        : _encode(src);
    /**
     * converts a UTF-8-encoded string to URL-safe Base64 RFC4648 §5.
     * @returns {string} Base64 string
     */
    const encodeURI = (src) => encode(src, true);
    /**
     * @deprecated should have been internal use only.
     * @param {string} src UTF-16 string
     * @returns {string} UTF-8 string
     */
    const btou = (src) => decodeURIComponent(escape(src));
    /**
     * polyfill version of `atob`
     */
    const atobPolyfill = (asc) => {
        // console.log('polyfilled');
        asc = asc.replace(/\s+/g, '');
        if (!b64re.test(asc))
            throw new TypeError('malformed base64.');
        asc += '=='.slice(2 - (asc.length & 3));
        let u24, bin = '', r1, r2;
        for (let i = 0; i < asc.length;) {
            u24 = b64tab[asc.charAt(i++)] << 18
                | b64tab[asc.charAt(i++)] << 12
                | (r1 = b64tab[asc.charAt(i++)]) << 6
                | (r2 = b64tab[asc.charAt(i++)]);
            bin += r1 === 64 ? _fromCC(u24 >> 16 & 255)
                : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255)
                    : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
        }
        return bin;
    };
    /**
     * does what `window.atob` of web browsers do.
     * @param {String} asc Base64-encoded string
     * @returns {string} binary string
     */
    const _atob = _hasatob ? (asc) => atob(_tidyB64(asc))
        : _hasBuffer ? (asc) => Buffer.from(asc, 'base64').toString('binary')
            : atobPolyfill;
    const _decode = _hasBuffer
        ? (a) => Buffer.from(a, 'base64').toString('utf8')
        : (a) => btou(_atob(a));
    const _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == '-' ? '+' : '/'));
    /**
     * converts a Base64 string to a UTF-8 string.
     * @param {String} src Base64 string.  Both normal and URL-safe are supported
     * @returns {string} UTF-8 string
     */
    const decode = (src) => _decode(_unURI(src));
    /**
     * converts a Base64 string to a Uint8Array.
     */
    const toUint8Array = _hasBuffer
        ? (a) => _U8Afrom(Buffer.from(_unURI(a), 'base64'))
        : (a) => _U8Afrom(_atob(_unURI(a)), c => c.charCodeAt(0));
    const _noEnum = (v) => {
        return {
            value: v, enumerable: false, writable: true, configurable: true
        };
    };
    /**
     * extend String.prototype with relevant methods
     */
    const extendString = function () {
        const _add = (name, body) => Object.defineProperty(String.prototype, name, _noEnum(body));
        _add('fromBase64', function () { return decode(this); });
        _add('toBase64', function (urlsafe) { return encode(this, urlsafe); });
        _add('toBase64URI', function () { return encode(this, true); });
        _add('toBase64URL', function () { return encode(this, true); });
        _add('toUint8Array', function () { return toUint8Array(this); });
    };
    /**
     * extend Uint8Array.prototype with relevant methods
     */
    const extendUint8Array = function () {
        const _add = (name, body) => Object.defineProperty(Uint8Array.prototype, name, _noEnum(body));
        _add('toBase64', function (urlsafe) { return fromUint8Array(this, urlsafe); });
        _add('toBase64URI', function () { return fromUint8Array(this, true); });
        _add('toBase64URL', function () { return fromUint8Array(this, true); });
    };
    /**
     * extend Builtin prototypes with relevant methods
     */
    const extendBuiltins = () => {
        extendString();
        extendUint8Array();
    };
    const gBase64 = {
        version: version,
        VERSION: VERSION,
        atob: _atob,
        atobPolyfill: atobPolyfill,
        btoa: _btoa,
        btoaPolyfill: btoaPolyfill,
        fromBase64: decode,
        toBase64: encode,
        encode: encode,
        encodeURI: encodeURI,
        encodeURL: encodeURI,
        utob: utob,
        btou: btou,
        decode: decode,
        fromUint8Array: fromUint8Array,
        toUint8Array: toUint8Array,
        extendString: extendString,
        extendUint8Array: extendUint8Array,
        extendBuiltins: extendBuiltins,
    };

    //
    // export Base64 to the namespace
    //
    // ES5 is yet to have Object.assign() that may make transpilers unhappy.
    // gBase64.Base64 = Object.assign({}, gBase64);
    gBase64.Base64 = {};
    Object.keys(gBase64).forEach(k => gBase64.Base64[k] = gBase64[k]);
    return gBase64;
}));