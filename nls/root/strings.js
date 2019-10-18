/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

// English - root strings

define({
    "DIALOG_HEAD_REQUIRED"      : "HEAD tag required",
    "DIALOG_HEAD_MSG"     		: "<strong>Problem:</strong> Cannot find HEAD tag in the document to add the XMPL scripts to.  <strong>Solution:</strong> Check that the document is a valid HTML file with a &lt;head&gt;&lt;/head&gt; tag defined.",
    "DIALOG_JQUERY_DEFINED"     : "JQuery already defined",
    "DIALOG_JQUERY_MSG"       	: "<strong>Problem:</strong> JQuery has already been defined in this document. XMPL requires a specific JQuery version. <strong>Solution:</strong> Remove the &lt;script&gt; tag that loads JQuery before adding the the XMPL scripts.",
    "DIALOG_XMPCFG_DEFINED"     : "Xmpcfg.js already defined",
	"DIALOG_XMPCFG_MSG"			: "<strong>Problem:</strong> The XMPie Configuration (xmpcfg.js) has already been defined in this document. <strong>Solution:</strong> Remove the &lt;script&gt; tag that loads xmpcfg.js before adding the the XMPL scripts.",
	"DIALOG_BODY_REQUIRED"		: "BODY tag required",
	"DIALOG_BODY_MSG"			: "<strong>Problem:</strong> Cannot find BODY tag in the document to attach the XMPL code to.  <strong>Solution:</strong> Check that the document is a valid HTML file with a &lt;body&gt;&lt;/body&gt; tag defined.",
	"MENU_HEADER"				: "Insert XMPL Header Scripts",
	"MENU_BODY_LANDING"			: "Insert Body tag for XMPL Landing page",
	"MENU_BODY_INTERNAL"		: "Insert Body tag for XMPL Internal page",
	"MENU_BODY_ANONYMOUS"		: "Insert Body tag for XMPL Anonymous page",
	"MENU_ADOR_TEXT"			: "Insert Text ADOR Snippet",
	"MENU_ADOR_GRAPHIC"			: "Insert Graphic ADOR Snippet",
	"MENU_ADOR_STYLE"			: "Insert Style ADOR Snippet",
	"MENU_ADOR_VISIBILITY"		: "Insert Visibility ADOR Snippet",
	"MENU_ADOR_TABLE"			: "Insert Table ADOR Snippet",
	"MENU_FORM_UPDATE"			: "Insert Update Form Snippet",
	"MENU_FORM_REFER"			: "Insert Refer-a-friend Form Snippet",
	"MENU_FORM_REGISTER"		: "Insert Self-register Form Snippet",
	"MENU_TAG_PAGELOAD"			: "Insert tag to update an ADOR on Page load"
});
