"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EjsAdapter = void 0;
const ejs_1 = require("ejs");
const lodash_1 = require("lodash");
const fs = require("fs");
const path = require("path");
const inlineCss = require("inline-css");
class EjsAdapter {
    constructor(config) {
        this.precompiledTemplates = {};
        this.config = {
            inlineCssOptions: { url: ' ' },
            inlineCssEnabled: true,
        };
        Object.assign(this.config, config);
    }
    compile(mailTemplate, mailContext, callback, mailerOptions) {
        const templateExt = path.extname(mailTemplate) || '.ejs';
        const templateName = path.basename(mailTemplate, path.extname(mailTemplate));
        const templateDir = mailTemplate.startsWith('./')
            ? path.dirname(mailTemplate)
            : lodash_1.get(mailerOptions, 'template.dir', '');
        const templateIdGetter = lodash_1.get(mailerOptions, 'template.templateIdGetter', () => templateName);
        const templateId = templateIdGetter(mailTemplate);
        const templatePath = path.join(templateDir, templateName + templateExt);
        if (!this.precompiledTemplates[templateId]) {
            try {
                const template = fs.readFileSync(templatePath, 'UTF-8');
                this.precompiledTemplates[templateId] = ejs_1.compile(template, Object.assign(Object.assign({}, lodash_1.get(mailerOptions, 'template.options', {})), { filename: templatePath }));
            }
            catch (err) {
                return callback(err);
            }
        }
        const rendered = this.precompiledTemplates[templateId](mailContext);
        const render = (html) => {
            if (this.config.inlineCssEnabled) {
                inlineCss(html, this.config.inlineCssOptions).then((html) => {
                    return callback(null, html);
                });
            }
            else {
                return callback(null, html);
            }
        };
        if (typeof rendered === 'string') {
            render(rendered);
        }
        else {
            rendered.then(render);
        }
    }
}
exports.EjsAdapter = EjsAdapter;
