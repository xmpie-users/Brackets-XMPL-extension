/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var CommandManager  = brackets.getModule("command/CommandManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        Menus           = brackets.getModule("command/Menus"),
        _               = brackets.getModule("thirdparty/lodash"),
        AppInit         = brackets.getModule("utils/AppInit"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        HTMLUtils       = brackets.getModule("language/HTMLUtils"),
        HTMLTags        = require("text!HtmlTags.json"),
        HTMLAttributes  = require("text!HtmlAttributes.json"),
        Dialogs         = brackets.getModule('widgets/Dialogs'),
        DefaultDialogs  = brackets.getModule("widgets/DefaultDialogs"),
        Strings         = require("strings"),
        tags,
        attributes;

    /**
     * @constructor
     */
    function TagHints() {
        this.exclusion = null;
    }
    
    /**
     * Check whether the exclusion is still the same as text after the cursor. 
     * If not, reset it to null.
     */
    TagHints.prototype.updateExclusion = function () {
        var textAfterCursor;
        if (this.exclusion && this.tagInfo) {
            textAfterCursor = this.tagInfo.tagName.substr(this.tagInfo.position.offset);
            if (!CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                this.exclusion = null;
            }
        }
    };
    
    /**
     * Determines whether HTML tag hints are available in the current editor
     * context.
     * 
     * @param {Editor} editor 
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar 
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean} 
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    TagHints.prototype.hasHints = function (editor, implicitChar) {
        var pos = editor.getCursorPos();
        
        this.tagInfo = HTMLUtils.getTagInfo(editor, pos);
        this.editor = editor;
        if (implicitChar === null) {
            if (this.tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
                if (this.tagInfo.position.offset >= 0) {
                    if (this.tagInfo.position.offset === 0) {
                        this.exclusion = this.tagInfo.tagName;
                    } else {
                        this.updateExclusion();
                    }
                    return true;
                }
            }
            return false;
        } else {
            if (implicitChar === "<") {
                this.exclusion = this.tagInfo.tagName;
                return true;
            }
            return false;
        }
    };
       
    /**
     * Returns a list of availble HTML tag hints if possible for the current
     * editor context. 
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    TagHints.prototype.getHints = function (implicitChar) {
        var query,
            result;

        this.tagInfo = HTMLUtils.getTagInfo(this.editor, this.editor.getCursorPos());
        if (this.tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            if (this.tagInfo.position.offset >= 0) {
                this.updateExclusion();
                query = this.tagInfo.tagName.slice(0, this.tagInfo.position.offset);
                result = $.map(tags, function (value, key) {
                    if (key.indexOf(query) === 0) {
                        return key;
                    }
                }).sort();
                
                return {
                    hints: result,
                    match: query,
                    selectInitial: true,
                    handleWideResults: false
                };
            }
        }
        
        return null;
    };
    
    /**
     * Inserts a given HTML tag hint into the current editor context. 
     * 
     * @param {string} hint 
     * The hint to be inserted into the editor context.
     *
     * @return {boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    TagHints.prototype.insertHint = function (completion) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            cursor = this.editor.getCursorPos(),
            charCount = 0;

        if (this.tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            var textAfterCursor = this.tagInfo.tagName.substr(this.tagInfo.position.offset);
            if (CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                charCount = this.tagInfo.position.offset;
            } else {
                charCount = this.tagInfo.tagName.length;
            }
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - this.tagInfo.position.offset;
        end.ch = start.ch + charCount;

        if (this.exclusion || completion !== this.tagInfo.tagName) {
            if (start.ch !== end.ch) {
                this.editor.document.replaceRange(completion, start, end);
            } else {
                this.editor.document.replaceRange(completion, start);
            }
            this.exclusion = null;
        }
        
        return false;
    };

    /**
     * @constructor
     */
    function AttrHints() {
        this.globalAttributes = this.readGlobalAttrHints();
        this.cachedHints = null;
        this.exclusion = "";
    }

    /**
     * @private
     * Parse the code hints from JSON data and extract all hints from property names.
     * @return {!Array.<string>} An array of code hints read from the JSON data source.
     */
    AttrHints.prototype.readGlobalAttrHints = function () {
        return $.map(attributes, function (value, key) {
            if (value.global === "true") {
                return key;
            }
        });
    };

    /**
     * Helper function that determines the possible value hints for a given html tag/attribute name pair
     * 
     * @param {{queryStr: string}} query
     * The current query
     *
     * @param {string} tagName 
     * HTML tag name
     *
     * @param {string} attrName 
     * HTML attribute name
     *
     * @return {{hints: Array.<string>|$.Deferred, sortFunc: ?Function}} 
     * The (possibly deferred) hints and the sort function to use on thise hints.
     */
    AttrHints.prototype._getValueHintsForAttr = function (query, tagName, attrName) {
        // We look up attribute values with tagName plus a slash and attrName first.  
        // If the lookup fails, then we fall back to look up with attrName only. Most 
        // of the attributes in JSON are using attribute name only as their properties, 
        // but in some cases like "type" attribute, we have different properties like 
        // "script/type", "link/type" and "button/type".
        var hints = [],
            sortFunc = null;
        
        var tagPlusAttr = tagName + "/" + attrName,
            attrInfo = attributes[tagPlusAttr] || attributes[attrName];
        
        if (attrInfo) {
            if (attrInfo.type === "boolean") {
                hints = ["false", "true"];
            } else if (attrInfo.attribOption) {
                hints = attrInfo.attribOption;
            }
        }
        
        return { hints: hints, sortFunc: sortFunc };
    };
    
    /**
     * Check whether the exclusion is still the same as text after the cursor. 
     * If not, reset it to null.
     *
     * @param {boolean} attrNameOnly
     * true to indicate that we update the exclusion only if the cursor is inside an attribute name context.
     * Otherwise, we also update exclusion for attribute value context.
     */
    AttrHints.prototype.updateExclusion = function (attrNameOnly) {
        if (this.exclusion && this.tagInfo) {
            var tokenType = this.tagInfo.position.tokenType,
                offset = this.tagInfo.position.offset,
                textAfterCursor;
            
            if (tokenType === HTMLUtils.ATTR_NAME) {
                textAfterCursor = this.tagInfo.attr.name.substr(offset);
            } else if (!attrNameOnly && tokenType === HTMLUtils.ATTR_VALUE) {
                textAfterCursor = this.tagInfo.attr.value.substr(offset);
            }
            if (!CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                this.exclusion = null;
            }
        }
    };
    
    /**
     * Determines whether HTML attribute hints are available in the current 
     * editor context.
     * 
     * @param {Editor} editor 
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar 
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean} 
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non-null,
     * whether it is appropriate to do so.
     */
    AttrHints.prototype.hasHints = function (editor, implicitChar) {
        var pos = editor.getCursorPos(),
            tokenType,
            offset,
            query;
        
        this.editor = editor;
        this.tagInfo = HTMLUtils.getTagInfo(editor, pos);
        tokenType = this.tagInfo.position.tokenType;
        offset = this.tagInfo.position.offset;
        if (implicitChar === null) {
            query = null;
             
            if (tokenType === HTMLUtils.ATTR_NAME) {
                if (offset >= 0) {
                    query = this.tagInfo.attr.name.slice(0, offset);
                }
            } else if (tokenType === HTMLUtils.ATTR_VALUE) {
                if (this.tagInfo.position.offset >= 0) {
                    query = this.tagInfo.attr.value.slice(0, offset);
                } else {
                    // We get negative offset for a quoted attribute value with some leading whitespaces 
                    // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                    // So just set the queryStr to an empty string. 
                    query = "";
                }
                
                // If we're at an attribute value, check if it's an attribute name that has hintable values.
                if (this.tagInfo.attr.name) {
                    var hintsAndSortFunc = this._getValueHintsForAttr({queryStr: query},
                                                                      this.tagInfo.tagName,
                                                                      this.tagInfo.attr.name);
                    var hints = hintsAndSortFunc.hints;
                    if (hints instanceof Array) {
                        // If we got synchronous hints, check if we have something we'll actually use
                        var i, foundPrefix = false;
                        for (i = 0; i < hints.length; i++) {
                            if (hints[i].indexOf(query) === 0) {
                                foundPrefix = true;
                                break;
                            }
                        }
                        if (!foundPrefix) {
                            query = null;
                        }
                    }
                }
            }

            if (offset >= 0) {
                if (tokenType === HTMLUtils.ATTR_NAME && offset === 0) {
                    this.exclusion = this.tagInfo.attr.name;
                } else {
                    this.updateExclusion(false);
                }
            }
            
            return query !== null;
        } else {
            if (implicitChar === " " || implicitChar === "'" ||
                    implicitChar === "\"" || implicitChar === "=") {
                if (tokenType === HTMLUtils.ATTR_NAME) {
                    this.exclusion = this.tagInfo.attr.name;
                }
                return true;
            }
            return false;
        }
    };
    
    /**
     * Returns a list of availble HTML attribute hints if possible for the 
     * current editor context. 
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    AttrHints.prototype.getHints = function (implicitChar) {
        var cursor = this.editor.getCursorPos(),
            query = {queryStr: null},
            tokenType,
            offset,
            result = [];
 
        this.tagInfo = HTMLUtils.getTagInfo(this.editor, cursor);
        tokenType = this.tagInfo.position.tokenType;
        offset = this.tagInfo.position.offset;
        if (tokenType === HTMLUtils.ATTR_NAME || tokenType === HTMLUtils.ATTR_VALUE) {
            query.tag = this.tagInfo.tagName;
            
            if (offset >= 0) {
                if (tokenType === HTMLUtils.ATTR_NAME) {
                    query.queryStr = this.tagInfo.attr.name.slice(0, offset);
                } else {
                    query.queryStr = this.tagInfo.attr.value.slice(0, offset);
                    query.attrName = this.tagInfo.attr.name;
                }
                this.updateExclusion(false);
            } else if (tokenType === HTMLUtils.ATTR_VALUE) {
                // We get negative offset for a quoted attribute value with some leading whitespaces 
                // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                // So just set the queryStr to an empty string. 
                query.queryStr = "";
                query.attrName = this.tagInfo.attr.name;
            }

            query.usedAttr = HTMLUtils.getTagAttributes(this.editor, cursor);
        }

        if (query.tag && query.queryStr !== null) {
            var tagName = query.tag,
                attrName = query.attrName,
                filter = query.queryStr,
                unfiltered = [],
                hints = [],
                sortFunc = null;

            if (attrName) {
                var hintsAndSortFunc = this._getValueHintsForAttr(query, tagName, attrName);
                hints = hintsAndSortFunc.hints;
                sortFunc = hintsAndSortFunc.sortFunc;
                
            } else if (tags && tags[tagName] && tags[tagName].attributes) {
                unfiltered = tags[tagName].attributes.concat(this.globalAttributes);
                hints = $.grep(unfiltered, function (attr, i) {
                    return $.inArray(attr, query.usedAttr) < 0;
                });
            }
            
            if (hints instanceof Array && hints.length) {
                console.assert(!result.length);
                result = $.map(hints, function (item) {
                    if (item.indexOf(filter) === 0) {
                        return item;
                    }
                }).sort(sortFunc);
                return {
                    hints: result,
                    match: query.queryStr,
                    selectInitial: true,
                    handleWideResults: false
                };
            } else if (hints instanceof Object && hints.hasOwnProperty("done")) { // Deferred hints
                var deferred = $.Deferred();
                hints.done(function (asyncHints) {
                    deferred.resolveWith(this, [{
                        hints: asyncHints,
                        match: query.queryStr,
                        selectInitial: true,
                        handleWideResults: false
                    }]);
                });
                return deferred;
            } else {
                return null;
            }
        }

        
    };
    
    /**
     * Inserts a given HTML attribute hint into the current editor context.
     * 
     * @param {string} hint 
     * The hint to be inserted into the editor context.
     * 
     * @return {boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    AttrHints.prototype.insertHint = function (completion) {
        var cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tokenType = this.tagInfo.position.tokenType,
            offset = this.tagInfo.position.offset,
            charCount = 0,
            insertedName = false,
            replaceExistingOne = this.tagInfo.attr.valueAssigned,
            endQuote = "",
            shouldReplace = true,
            textAfterCursor;

        if (tokenType === HTMLUtils.ATTR_NAME) {
            textAfterCursor = this.tagInfo.attr.name.substr(offset);
            if (CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                charCount = offset;
                replaceExistingOne = false;
            } else {
                charCount = this.tagInfo.attr.name.length;
            }
            // Append an equal sign and two double quotes if the current attr is not an empty attr
            // and then adjust cursor location before the last quote that we just inserted.
            if (!replaceExistingOne && attributes && attributes[completion] &&
                    attributes[completion].type !== "flag") {
                completion += "=\"\"";
                insertedName = true;
            } else if (completion === this.tagInfo.attr.name) {
                shouldReplace = false;
            }
        } else if (tokenType === HTMLUtils.ATTR_VALUE) {
            textAfterCursor = this.tagInfo.attr.value.substr(offset);
            if (CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                charCount = offset;
                // Set exclusion to null only after attribute value insertion,
                // not after attribute name insertion since we need to keep it 
                // for attribute value insertion.
                this.exclusion = null;
            } else {
                charCount = this.tagInfo.attr.value.length;
            }
            
            if (!this.tagInfo.attr.hasEndQuote) {
                endQuote = this.tagInfo.attr.quoteChar;
                if (endQuote) {
                    completion += endQuote;
                } else if (offset === 0) {
                    completion = "\"" + completion + "\"";
                }
            } else if (completion === this.tagInfo.attr.value) {
                shouldReplace = false;
            }
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - offset;
        end.ch = start.ch + charCount;

        if (shouldReplace) {
            if (start.ch !== end.ch) {
                this.editor.document.replaceRange(completion, start, end);
            } else {
                this.editor.document.replaceRange(completion, start);
            }
        }

        if (insertedName) {
            this.editor.setCursorPos(start.line, start.ch + completion.length - 1);

            // Since we're now inside the double-quotes we just inserted,
            // immediately pop up the attribute value hint.
            return true;
        } else if (tokenType === HTMLUtils.ATTR_VALUE && this.tagInfo.attr.hasEndQuote) {
            // Move the cursor to the right of the existing end quote after value insertion.
            this.editor.setCursorPos(start.line, start.ch + completion.length + 1);
        }
        
        return false;
    };
    
    //function to insert xmpl script tags to the header
    function insertXmplScripts() {
        var regex,found;
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var currentDoc = editor.document.getText();
            
            //check there is a head tag
            regex = /<head>/i;
            found = currentDoc.match(regex);
            if (!found || found.length < 1){
                Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.DIALOG_HEAD_REQUIRED, Strings.DIALOG_HEAD_MSG);
                return false;
            }
            
            //check jquery is not already defined
            regex = /<script.+jquery.min.js/i;
            found = currentDoc.match(regex);
            if (found){
                Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.DIALOG_JQUERY_DEFINED, Strings.DIALOG_JQUERY_MSG);
                return false;
            }
            
            //check xmpcfg.js is not already defined
            regex = /<script.+xmpcfg.js/i;
            found = currentDoc.match(regex);
            if (found){
                Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.DIALOG_XMPCFG_DEFINED, Strings.DIALOG_XMPCFG_MSG);
                return false;
            }
            
            //just remove the xmpl library comments and css if they exist
            regex = /<link.+\/xmp\/css\/xmp.css.+>/i;
            currentDoc = currentDoc.replace(regex, '');
            currentDoc = currentDoc.replace('<!-- XMPie XMPL library -->\n', '');
            
            //update the document
            var stringToInsert = '\n\t\t<!-- XMPie XMPL library -->\n\t\t';
                stringToInsert += '<link href="https://ajax.xmcircle.com/ajax/libs/xmpl/3.1.4/xmp/css/xmp.css" rel="stylesheet" media="screen">\n\t\t';
                stringToInsert += '<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>\n\t\t';
                stringToInsert += '<script src="https://ajax.xmcircle.com/ajax/libs/xmpl/3.1.4/xmp/js/xmp.min.js"></script>\n\t\t';
                stringToInsert += '<script src="./xmpcfg.js"></script>\n';
            var startPos = currentDoc.indexOf('</head>');
            var newdoc  = currentDoc.substring(0,startPos) + stringToInsert + currentDoc.substring(startPos);
            editor.document.setText(newdoc);
        }
    }
    
    //function to insert XMPL body tag attributes
    function insertBodyTagAttributes(pageType) {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var currentDoc = editor.document.getText();
            var startPos = currentDoc.indexOf('<body');
            //exit if the document doesn't have a body tag
            if (startPos == -1) {
                Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.DIALOG_BODY_REQUIRED, Strings.DIALOG_BODY_MSG);
                return false;
            } else {
                var stringToInsert = "";
                if (pageType == "landing") {
                    stringToInsert = ' ng-app="xmp.app"\n\t\tng-controller="XMPPersonalizedPage"\n\t\txmp-cloak\n\t\t';
                    stringToInsert += 'xmp-clear-all-cookies-onload\n\t\txmp-tracking-page-name="Landing"';
                } else if (pageType == "internal") {
                    stringToInsert = ' ng-app="xmp.app"\n\t\tng-controller="XMPPersonalizedPage"\n\t\txmp-cloak\n\t\t';
                    stringToInsert += 'xmp-tracking-page-name="PageName"';
                } else if (pageType == "anonymous") {
                    stringToInsert = ' ng-app="xmp.app"\n\t\tng-controller="XMPAnonymousPage"\n\t\t';
                    stringToInsert += 'xmp-clear-all-cookies-onload';
                }
                var endPos = currentDoc.indexOf('>',startPos);
                var newdoc  = currentDoc.substring(0,endPos) + stringToInsert + currentDoc.substring(endPos);
                editor.document.setText(newdoc);
            }
        }
    }
    
    // function for inserting XMPie snippets into the editor
    function insertAdorSnippet(adorType) {
		var stringToInsert = "";
		switch (adorType) {
			case "text":
				stringToInsert = '{{xmp.r["TextAdorName"]}}';
				break;
			case "graphic":
				stringToInsert = '<img xmp-image-asset="xmp.r.GraphicAdorName" />';
				break;
			case "style":
				stringToInsert = '<span xmp-class="xmp.r.StyleAdorName">Your text here</span>';
				break;
			case "link":
				stringToInsert = '<a xmp-href="{{xmp.r[\'LinkAdorName\']}}">Your text here</a>';
				break;
			case "rurl":
				stringToInsert = '<a xmp-href="{{xmp.r[\'XMPieRURL\']}}">Visit your personalized website</a>';
				break;
			case "pdf":
				stringToInsert = '<a xmp-href="{{xmp.r[\'XMPie.PDF.P1\']}}">View the PDF</a>';
				break;
            case "visibility":
                stringToInsert = '<div xmp-show="xmp.r.Membership==\'Gold\'">Your content here</div>';
                break;
            case "table":
                stringToInsert = '\n<table>\n\t<tr>\n\t\t<th>First Name</th>\n\t\t<th>Last Name</th>\n\t</tr>\n\t';
                stringToInsert += '<tr xmp-repeat="Department in xmp.r.Departments">\n\t\t<td>{{Department.FirstName}}</td>\n\t\t';
                stringToInsert += '<td>{{Department.LastName}}</td>\n\t</tr>\n</table>';
                break;
            case "update":
                stringToInsert = '\n<form xmp-update>\n\tFirst Name: <input type="text" xmp-write-ador="xmp.r.Fname"><br />\n\t';
                stringToInsert += '<input type="checkbox" xmp-write-ador="xmp.r.Gift" xmp-true-value="SendGift" xmp-false-value="DontSendGift"> Send me my gift card. <br />\n\t';
                stringToInsert += 'Model: <select name="singleSelect" xmp-write-ador="xmp.r.MyAdor">\n\t\t';
                stringToInsert += '<option value="Defender">Defender</option>\n\t\t<option value="Discovery">Discovery</option>\n\t\t';
                stringToInsert += '<option value="Evoque">Evoque</option>\n\t</select>\n\t';
                stringToInsert += '<input class="btn-primary" type="submit" value="save" xmp-success-url="thanks.html" xmp-tracking-action="form submitted">\n</form>';
                break;
            case "refer":
                stringToInsert = '\n<form xmp-refer>\n\tFirst Name: <input type="text" xmp-write-ador="xmp.referredRecipient.Fname">\n\t';
                stringToInsert += '<input class="btn-primary" type="submit" value="save" xmp-success-url="thanks.html">\n</form>';
                break;
            case "self":
                stringToInsert = '\n<form xmp-register>\n\tFirst Name: <input type="text" xmp-write-ador="xmp.r.Fname">\n\t';
                stringToInsert += '<input class="btn-primary" type="submit" value="save" xmp-success-url="thanks.html">\n</form>';
                break;
            case "updateOnLoad":
                stringToInsert = '<xmp-update-on-page-load xmp-ador="xmp.r[\'Visited\']" xmp-value="1"/>';
		}
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
			var insertionSel = editor.getSelection(); 
			editor.document.replaceRange(stringToInsert, insertionSel.start, insertionSel.end);
        }
    };
   
    //commands for xmpl menus
    var headScriptsCommand = CommandManager.register(Strings.MENU_HEADER, "xmpl.writeHeaderScriptsSnippet", insertXmplScripts);
    var bodyLandingScriptsCommand = CommandManager.register(Strings.MENU_BODY_LANDING, "xmpl.writeBodyLandingSnippet", _.partial(insertBodyTagAttributes, "landing"));
    var bodyInternalScriptsCommand = CommandManager.register(Strings.MENU_BODY_INTERNAL, "xmpl.writeBodyInternalSnippet", _.partial(insertBodyTagAttributes, "internal"));
    var bodyAnonymousScriptsCommand = CommandManager.register(Strings.MENU_BODY_ANONYMOUS, "xmpl.writeBodyAnonymousSnippet", _.partial(insertBodyTagAttributes, "anonymous"));
    CommandManager.register(Strings.MENU_ADOR_TEXT, "xmpl.writeTextAdorSnippet", _.partial(insertAdorSnippet, "text"));
    CommandManager.register(Strings.MENU_ADOR_GRAPHIC, "xmpl.writeGraphicAdorSnippet", _.partial(insertAdorSnippet, "graphic"));
    CommandManager.register(Strings.MENU_ADOR_STYLE, "xmpl.writeStyleAdorSnippet", _.partial(insertAdorSnippet, "style"));
    CommandManager.register(Strings.MENU_ADOR_VISIBILITY, "xmpl.writeVisibilityAdorSnippet", _.partial(insertAdorSnippet, "visibility"));
    CommandManager.register(Strings.MENU_ADOR_TABLE, "xmpl.writeTableAdorSnippet", _.partial(insertAdorSnippet, "table"));
    CommandManager.register(Strings.MENU_FORM_UPDATE, "xmpl.writeUpdateFormSnippet", _.partial(insertAdorSnippet, "update"));
    CommandManager.register(Strings.MENU_FORM_REFER, "xmpl.writeReferFormSnippet", _.partial(insertAdorSnippet, "refer"));
    CommandManager.register(Strings.MENU_FORM_REGISTER, "xmpl.writeSelfFormSnippet", _.partial(insertAdorSnippet, "self"));
    CommandManager.register(Strings.MENU_TAG_PAGELOAD, "xmpl.writeUpdateOnLoadSnippet", _.partial(insertAdorSnippet, "updateOnLoad"));
    
    function updateContextMenuState() {
        var doc = EditorManager.getCurrentFullEditor();
        
        //disable headScriptsCommand if the script is already in the page
        var headerScriptCheckString = 'xmp.min.js';
        if ($(doc.getRootElement()).text().indexOf(headerScriptCheckString) >= 0) {
            headScriptsCommand.setEnabled(false);
        } else {
            headScriptsCommand.setEnabled(true);
        }
        
        //disable the bodyScriptsCommands if the script is already in the page
        var bodyScriptCheckString = 'ng-app="xmp.app"';
        if ($(doc.getRootElement()).text().indexOf(bodyScriptCheckString) >= 0) {
            bodyLandingScriptsCommand.setEnabled(false);
            bodyInternalScriptsCommand.setEnabled(false);
            bodyAnonymousScriptsCommand.setEnabled(false);
        } else {
            bodyLandingScriptsCommand.setEnabled(true);
            bodyInternalScriptsCommand.setEnabled(true);
            bodyAnonymousScriptsCommand.setEnabled(true);
        }
    }

    AppInit.appReady(function () {
        // Parse JSON files
        tags = JSON.parse(HTMLTags);
        attributes = JSON.parse(HTMLAttributes);
        
        // Register code hint providers
        var tagHints = new TagHints();
        var attrHints = new AttrHints();
        CodeHintManager.registerHintProvider(tagHints, ["html"], 9);
        CodeHintManager.registerHintProvider(attrHints, ["html"], 9);
    
        // For unit testing
        exports.tagHintProvider = tagHints;
        exports.attrHintProvider = attrHints;
        
        //get the editor context menu and add the xmpl items
        var editor_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
        editor_cmenu.addMenuDivider();
        editor_cmenu.addMenuItem("xmpl.writeHeaderScriptsSnippet");
        editor_cmenu.addMenuDivider();
        editor_cmenu.addMenuItem("xmpl.writeBodyLandingSnippet");
        editor_cmenu.addMenuItem("xmpl.writeBodyInternalSnippet");
        editor_cmenu.addMenuItem("xmpl.writeBodyAnonymousSnippet");
        editor_cmenu.addMenuDivider();
        editor_cmenu.addMenuItem("xmpl.writeTextAdorSnippet");
        editor_cmenu.addMenuItem("xmpl.writeGraphicAdorSnippet");
        editor_cmenu.addMenuItem("xmpl.writeStyleAdorSnippet");
        editor_cmenu.addMenuItem("xmpl.writeVisibilityAdorSnippet");
        editor_cmenu.addMenuItem("xmpl.writeTableAdorSnippet");
        editor_cmenu.addMenuDivider();
        editor_cmenu.addMenuItem("xmpl.writeUpdateFormSnippet");
        editor_cmenu.addMenuItem("xmpl.writeReferFormSnippet");
        editor_cmenu.addMenuItem("xmpl.writeSelfFormSnippet");
        editor_cmenu.addMenuItem("xmpl.writeUpdateOnLoadSnippet");
        
        //check the doc before opening the context menu to disable some options if necessary
        editor_cmenu.on("beforeContextMenuOpen", updateContextMenuState);
    });
});
