"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PugAdapter = void 0;
const path = require("path");
const lodash_1 = require("lodash");
const pug_1 = require("pug");
const inlineCss = require("inline-css");
class PugAdapter {
    constructor(config) {
        this.config = {
            inlineCssOptions: { url: ' ' },
            inlineCssEnabled: true,
        };
        Object.assign(this.config, config);
    }
    compile(mailTemplate, mailContext, callback, mailerOptions) {
        const templateExt = path.extname(mailTemplate) || '.pug';
        const templateName = path.basename(mailTemplate, path.extname(mailTemplate));
        const templateDir = mailTemplate.startsWith('./')
            ? path.dirname(mailTemplate)
            : lodash_1.get(mailerOptions, 'template.dir', '');
        const templatePath = path.join(templateDir, templateName + templateExt);
        const options = Object.assign(Object.assign({}, mailContext), lodash_1.get(mailerOptions, 'template.options', {}));
        pug_1.renderFile(templatePath, options, (err, body) => {
            if (err) {
                return callback(err);
            }
            if (this.config.inlineCssEnabled) {
                inlineCss(body, this.config.inlineCssOptions).then((html) => {
                    return callback(html);
                });
            }
            else {
                return callback(body);
            }
        });
    }
}
exports.PugAdapter = PugAdapter;
