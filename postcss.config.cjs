const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
    plugins: [
        process.env.NODE_ENV === 'production'
            ? purgecss({
                content: [
                    './index.html',
                    './src/**/*.{js,jsx,ts,tsx}'
                ],
                safelist: [
                    // Safe-list basic HTML tags
                    'html', 'body', '#root',

                    // Safe-list any classes that might be dynamically toggled or required by Bootstrap's JS
                    /^modal/,
                    /^fade/,
                    /^show/,
                    /^nav/,
                    /^active/,
                    /^bi-/,
                ],
                defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
            })
            : null
    ].filter(Boolean)
};
