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

// French Translation

define({
    "DIALOG_HEAD_REQUIRED"      : "Étiquette HEAD requise",
    "DIALOG_HEAD_MSG"     		: "<strong>Problème:</strong> Impossible de trouver la balise HEAD dans le document à laquelle ajouter les scripts XMPL.  <strong>Solution:</strong> Vérifiez que le document est un fichier HTML valide avec une balise &lt;head&gt;&lt;/head&gt; définie.",
    "DIALOG_JQUERY_DEFINED"     : "JQuery déjà défini",
    "DIALOG_JQUERY_MSG"       	: "<strong>Problème:</strong> JQuery a déjà été défini dans ce document. XMPL nécessite une version spécifique de JQuery. <strong>Solution:</strong> Supprimez la balise de &lt;script&gt; qui charge JQuery avant d’ajouter les scripts XMPL.",
    "DIALOG_XMPCFG_DEFINED"     : "Xmpcfg.js déjà défini",
	"DIALOG_XMPCFG_MSG"			: "<strong>Problème:</strong> La configuration XMPie (xmpcfg.js) a déjà été définie dans ce document. <strong>Solution:</strong> Retirez le &lt;script&gt;. balise qui charge xmpcfg.js avant d'ajouter les scripts XMPL.",
	"DIALOG_BODY_REQUIRED"		: "BODY tag requis",
	"DIALOG_BODY_MSG"			: "<strong>Problème:</strong> Cannot find BODY tag in the document to attach the XMPL code to.  <strong>Solution:</strong> Vérifiez que le document est un fichier HTML valide avec une balise &lt;body&gt;&lt;/body&gt; définie.",
	"MENU_HEADER"				: "Insérer des scripts d'en-tête XMPL",
	"MENU_BODY_LANDING"			: "Insérer une balise body pour la page de destination XMPL",
	"MENU_BODY_INTERNAL"		: "Insérer une balise body pour la page interne XMPL",
	"MENU_BODY_ANONYMOUS"		: "Insérer une balise body pour la page XMPL Anonymous",
	"MENU_ADOR_TEXT"			: "Insérer du texte ADOR Snippet",
	"MENU_ADOR_GRAPHIC"			: "Insérer un extrait ADOR graphique",
	"MENU_ADOR_STYLE"			: "Insérer un style ADOR Snippet",
	"MENU_ADOR_VISIBILITY"		: "Insérer une visibilité ADOR Snippet",
	"MENU_ADOR_TABLE"			: "Insérer un extrait de code ADOR",
	"MENU_FORM_UPDATE"			: "Insérer un extrait de formulaire de mise à jour",
	"MENU_FORM_REFER"			: "Insérer un extrait de formulaire de parrainage",
	"MENU_FORM_REGISTER"		: "Insérer un extrait de formulaire auto-enregistré",
	"MENU_TAG_PAGELOAD"			: "Insérer une balise pour mettre à jour un ADOR au chargement de la page"
});
