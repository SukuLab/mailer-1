"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandlebarsAdapter = void 0;
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const inlineCss = require("inline-css");
const glob = require("glob");
const lodash_1 = require("lodash");
class HandlebarsAdapter {
    constructor(helpers, config) {
        this.precompiledTemplates = {};
        this.config = {
            inlineCssOptions: { url: ' ' },
            inlineCssEnabled: true,
        };
        handlebars.registerHelper('concat', (...args) => {
            args.pop();
            return args.join('');
        });
        handlebars.registerHelper(helpers || {});
        Object.assign(this.config, config);
    }
    compile(mailTemplate, mailContext, callback, mailerOptions) {
        const precompile = (template, options) => {
            const templateExt = path.extname(template) || '.hbs';
            const templateName = path.basename(template, path.extname(template));
            const templateDir = template.startsWith('./')
                ? path.dirname(template)
                : lodash_1.get(options, 'dir', '');
            const templateIdGetter = lodash_1.get(options, 'templateIdGetter', () => templateName);
            const templateId = templateIdGetter(template);
            const templatePath = path.join(templateDir, templateName + templateExt);
            let error = null;
            if (!this.precompiledTemplates[templateId]) {
                try {
                    const template = fs.readFileSync(templatePath, 'UTF-8');
                    this.precompiledTemplates[templateId] = handlebars.compile(template, lodash_1.get(options, 'options', {}));
                }
                catch (err) {
                    error = err;
                }
            }
            return {
                error,
                templateExt,
                templateName,
                templateId,
                templateDir,
                templatePath,
            };
        };
        const { templateId, error } = precompile(mailTemplate, mailerOptions.template);
        if (error) {
            return callback(error);
        }
        const runtimeOptions = lodash_1.get(mailerOptions, 'options', {
            partials: false,
            data: {},
        });
        if (runtimeOptions.partials) {
            const files = glob.sync(path.join(runtimeOptions.partials.dir, '*.hbs'));
            files.forEach((file) => precompile(file, runtimeOptions.partials));
        }
        const rendered = this.precompiledTemplates[templateId](mailContext, Object.assign(Object.assign({}, runtimeOptions), { partials: this.precompiledTemplates }));
        if (this.config.inlineCssEnabled) {
            inlineCss(rendered, this.config.inlineCssOptions).then((html) => {
                return callback(null, html);
            });
        }
        else {
            return callback(null, rendered);
        }
    }
}
exports.HandlebarsAdapter = HandlebarsAdapter;
